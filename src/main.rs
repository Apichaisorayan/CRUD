use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post, delete, Router},
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
struct Lead {
    id: i32,
    customer_id: Option<String>,
    display_name: Option<String>,
    phone: Option<String>,
    email: Option<String>,
    platform: Option<String>,
    line_uid: Option<String>,
    line_id: Option<String>,
    country: Option<String>,
    source: Option<String>,
    service_interest: Option<String>,
    lifecycle_stage: Option<String>,
    status: Option<String>,
    is_uql: Option<String>,
    is_mql: Option<String>,
    is_sql: Option<String>,
    mql_to_sql_days: Option<String>,
    assigned_sales: Option<String>,
    assigned_doctor: Option<String>,
    revenue_weight: Option<String>,
    close_won_month: Option<String>,
    reason_lost: Option<String>,
    notes: Option<String>,
    remark: Option<String>,
    is_inactive: Option<String>,
    date: Option<String>,
    month: Option<String>,
    year: Option<String>,
}

#[derive(Deserialize)]
struct LeadInput {
    pub customerId: Option<String>,
    pub displayName: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub platform: Option<String>,
    pub lineUid: Option<String>,
    pub lineId: Option<String>,
    pub country: Option<String>,
    pub source: Option<String>,
    pub serviceInterest: Option<String>,
    pub lifecycleStage: Option<String>,
    pub status: Option<String>,
    pub isUQL: Option<String>,
    pub isMQL: Option<String>,
    pub isSQL: Option<String>,
    pub mqlToSqlDays: Option<String>,
    pub assignedSales: Option<String>,
    pub assignedDoctor: Option<String>,
    pub revenueWeight: Option<String>,
    pub closeWonMonth: Option<String>,
    pub reasonLost: Option<String>,
    pub notes: Option<String>,
    pub remark: Option<String>,
    pub isInactive: Option<String>,
    pub date: Option<String>,
    pub month: Option<String>,
    pub year: Option<String>,
}

#[derive(Deserialize)]
struct PaginationQuery {
    page: Option<i64>,
    per_page: Option<i64>,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    
    let database_url = std::env::var("DATABASE_URL").unwrap_or_else(|_| "".into());
    if database_url.is_empty() {
        println!("Warning: DATABASE_URL not set. Database operations will fail.");
    }
    
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    println!("✅ Database connected successfully!");

    // Create table with all the mapped columns
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS leads (
            id SERIAL PRIMARY KEY,
            customer_id TEXT,
            display_name TEXT,
            phone TEXT,
            email TEXT,
            platform TEXT,
            line_uid TEXT,
            line_id TEXT,
            country TEXT,
            source TEXT,
            service_interest TEXT,
            lifecycle_stage TEXT,
            status TEXT,
            is_uql TEXT,
            is_mql TEXT,
            is_sql TEXT,
            mql_to_sql_days TEXT,
            assigned_sales TEXT,
            assigned_doctor TEXT,
            revenue_weight TEXT,
            close_won_month TEXT,
            reason_lost TEXT,
            notes TEXT,
            remark TEXT,
            is_inactive TEXT,
            date TEXT,
            month TEXT,
            year TEXT
        )
        "#
    )
    .execute(&pool)
    .await?;

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let api_routes = Router::new()
        .route("/leads", get(get_leads))
        .route("/leads/bulk", post(import_leads_bulk))
        .route("/leads/purge", delete(delete_all_leads))
        .route("/leads/:id", delete(delete_lead))
        .with_state(pool);

    let app = Router::new()
        .nest("/api", api_routes)
        .fallback_service(ServeDir::new("frontend"))
        .layer(cors);

    let port = std::env::var("PORT").unwrap_or_else(|_| "3000".into());
    let addr: SocketAddr = format!("0.0.0.0:{}", port).parse().unwrap();
    
    println!("Server running on http://{}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();

    Ok(())
}

async fn get_leads(
    State(pool): State<PgPool>,
    axum::extract::Query(pagination): axum::extract::Query<PaginationQuery>,
) -> impl IntoResponse {
    let per_page = pagination.per_page.unwrap_or(50);
    let page = pagination.page.unwrap_or(1);
    let offset = (page - 1) * per_page;

    let leads = sqlx::query_as::<_, Lead>(
        "SELECT * FROM leads ORDER BY id DESC LIMIT $1 OFFSET $2"
    )
    .bind(per_page)
    .bind(offset)
    .fetch_all(&pool)
    .await
    .unwrap_or_default();

    // Get total count for pagination info
    let total: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM leads")
        .fetch_one(&pool)
        .await
        .unwrap_or((0,));

    Json(serde_json::json!({
        "data": leads,
        "total": total.0,
        "page": page,
        "per_page": per_page
    }))
}

async fn delete_lead(
    State(pool): State<PgPool>,
    axum::extract::Path(id): axum::extract::Path<i32>,
) -> impl IntoResponse {
    let res = sqlx::query("DELETE FROM leads WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await;

    match res {
        Ok(_) => StatusCode::OK,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}

async fn delete_all_leads(State(pool): State<PgPool>) -> impl IntoResponse {
    let res = sqlx::query("DELETE FROM leads")
        .execute(&pool)
        .await;

    match res {
        Ok(_) => StatusCode::OK,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}

async fn import_leads_bulk(
    State(pool): State<PgPool>,
    Json(payload): Json<Vec<LeadInput>>,
) -> impl IntoResponse {
    let mut success_count = 0;

    // Use a transaction for bulk inserts
    if let Ok(mut tx) = pool.begin().await {
        for lead in payload {
            let res = sqlx::query(
                r#"
                INSERT INTO leads (
                    customer_id, display_name, phone, email, platform, line_uid, line_id, country, source,
                    service_interest, lifecycle_stage, status, is_uql, is_mql, is_sql, mql_to_sql_days,
                    assigned_sales, assigned_doctor, revenue_weight, close_won_month, reason_lost, notes,
                    remark, is_inactive, date, month, year
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9,
                    $10, $11, $12, $13, $14, $15, $16,
                    $17, $18, $19, $20, $21, $22,
                    $23, $24, $25, $26, $27
                )
                "#
            )
            .bind(&lead.customerId)
            .bind(&lead.displayName)
            .bind(&lead.phone)
            .bind(&lead.email)
            .bind(&lead.platform)
            .bind(&lead.lineUid)
            .bind(&lead.lineId)
            .bind(&lead.country)
            .bind(&lead.source)
            .bind(&lead.serviceInterest)
            .bind(&lead.lifecycleStage)
            .bind(&lead.status)
            .bind(&lead.isUQL)
            .bind(&lead.isMQL)
            .bind(&lead.isSQL)
            .bind(&lead.mqlToSqlDays)
            .bind(&lead.assignedSales)
            .bind(&lead.assignedDoctor)
            .bind(&lead.revenueWeight)
            .bind(&lead.closeWonMonth)
            .bind(&lead.reasonLost)
            .bind(&lead.notes)
            .bind(&lead.remark)
            .bind(&lead.isInactive)
            .bind(&lead.date)
            .bind(&lead.month)
            .bind(&lead.year)
            .execute(&mut *tx)
            .await;

            if res.is_ok() {
                success_count += 1;
            }
        }
        
        if tx.commit().await.is_ok() {
            (StatusCode::CREATED, Json(serde_json::json!({ "message": "Import successful", "imported_rows": success_count }))).into_response()
        } else {
            (StatusCode::INTERNAL_SERVER_ERROR, "Transaction commit failed").into_response()
        }
    } else {
        (StatusCode::INTERNAL_SERVER_ERROR, "Could not begin transaction").into_response()
    }
}
