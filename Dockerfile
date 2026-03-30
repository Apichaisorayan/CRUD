# Build stage
FROM rust:latest as builder
WORKDIR /app
COPY . .
# Update Cargo to use correct targets if needed, but slim-debian is usually fine
RUN cargo build --release

# Run stage
FROM debian:bookworm-slim
WORKDIR /app
# Install OpenSSL/libssl which is needed for SQLx/Postgres
RUN apt-get update && apt-get install -y libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/backend /app/backend
COPY --from=builder /app/frontend /app/frontend
EXPOSE 3000
CMD ["/app/backend"]
