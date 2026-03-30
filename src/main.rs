use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, Router},
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::postgres::PgPoolOptions;
use sqlx::{PgPool, FromRow};
use std::net::SocketAddr;
use dotenvy::dotenv;
use tower_http::cors::{Any, CorsLayer};
use tower_http::services::ServeDir;

#[derive(Serialize, Deserialize, FromRow, Clone)]
struct Material {
    id: i32,
    name: String,
    quantity: f64,
    unit_price: f64,
    category: Option<String>,
}

#[derive(Deserialize)]
struct CreateMaterial {
    name: String,
    quantity: f64,
    unit_price: f64,
    category: Option<String>,
}

#[derive(Deserialize)]
struct UpdateMaterial {
    name: Option<String>,
    quantity: Option<f64>,
    unit_price: Option<f64>,
    category: Option<String>,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    
    // Fallback to empty if not set (for Railway env setup)
    let database_url = std::env::var("DATABASE_URL").unwrap_or_else(|_| "".into());
    if database_url.is_empty() {
        println!("Warning: DATABASE_URL not set. Database operations will fail.");
    }
    
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    // Create materials table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS materials (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            quantity DOUBLE PRECISION NOT NULL DEFAULT 1,
            unit_price DOUBLE PRECISION NOT NULL DEFAULT 0,
            category TEXT
        )
        "#
    )
    .execute(&pool)
    .await?;

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // API Routes under /api prefix
    let api_routes = Router::new()
        .route("/materials", get(get_materials).post(create_material))
        .route("/materials/{id}", get(get_material).put(update_material).delete(delete_material))
        .with_state(pool);

    // Combine API with Static file server for Frontend
    let app = Router::new()
        .nest("/api", api_routes)
        .fallback_service(ServeDir::new("frontend"))
        .layer(cors);

    // Default port for Railway is 8080 or PORT env
    let port = std::env::var("PORT").unwrap_or_else(|_| "3000".into());
    let addr: SocketAddr = format!("0.0.0.0:{}", port).parse().unwrap();
    
    println!("Server running on http://{}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();

    Ok(())
}

async fn get_materials(State(pool): State<PgPool>) -> impl IntoResponse {
    let materials = sqlx::query_as::<_, Material>("SELECT * FROM materials ORDER BY id DESC")
        .fetch_all(&pool)
        .await
        .unwrap_or_default();
    Json(materials)
}

async fn create_material(
    State(pool): State<PgPool>,
    Json(payload): Json<CreateMaterial>,
) -> impl IntoResponse {
    let material = sqlx::query_as::<_, Material>(
        "INSERT INTO materials (name, quantity, unit_price, category) VALUES ($1, $2, $3, $4) RETURNING *"
    )
    .bind(payload.name)
    .bind(payload.quantity)
    .bind(payload.unit_price)
    .bind(payload.category)
    .fetch_one(&pool)
    .await;

    match material {
        Ok(m) => (StatusCode::CREATED, Json(m)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

async fn get_material(
    State(pool): State<PgPool>,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    let material = sqlx::query_as::<_, Material>("SELECT * FROM materials WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)
        .await;

    match material {
        Ok(Some(m)) => (StatusCode::OK, Json(m)).into_response(),
        Ok(None) => (StatusCode::NOT_FOUND, "Material not found").into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

async fn update_material(
    State(pool): State<PgPool>,
    Path(id): Path<i32>,
    Json(payload): Json<UpdateMaterial>,
) -> impl IntoResponse {
    let existing = sqlx::query_as::<_, Material>("SELECT * FROM materials WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)
        .await;

    if let Ok(Some(current)) = existing {
        let name = payload.name.unwrap_or(current.name);
        let quantity = payload.quantity.unwrap_or(current.quantity);
        let unit_price = payload.unit_price.unwrap_or(current.unit_price);
        let category = payload.category.or(current.category);

        let updated = sqlx::query_as::<_, Material>(
            "UPDATE materials SET name = $1, quantity = $2, unit_price = $3, category = $4 WHERE id = $5 RETURNING *"
        )
        .bind(name)
        .bind(quantity)
        .bind(unit_price)
        .bind(category)
        .bind(id)
        .fetch_one(&pool)
        .await;

        match updated {
            Ok(m) => (StatusCode::OK, Json(m)).into_response(),
            Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
        }
    } else {
        (StatusCode::NOT_FOUND, "Material not found").into_response()
    }
}

async fn delete_material(
    State(pool): State<PgPool>,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    let res = sqlx::query("DELETE FROM materials WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await;

    match res {
        Ok(r) if r.rows_affected() > 0 => StatusCode::NO_CONTENT.into_response(),
        Ok(_) => StatusCode::NOT_FOUND.into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}
