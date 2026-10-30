# Full-Stack To-Do List

A full-stack task manager built with Angular, Spring Boot, and MySQL. Docker Compose runs the complete app locally, and the `k8s` manifests are ready for a local Minikube cluster.

## Features

- Create, edit, complete, filter, and delete tasks
- Set task priority and an optional description
- Persist tasks in MySQL
- Use the same `/api` endpoints in local development, Docker, and Kubernetes

## Run with Docker Compose

Requirements: Docker Desktop with Compose.

From the project root:

```powershell
docker compose up --build
```

Open [http://localhost:4200](http://localhost:4200). The API is available at [http://localhost:8080/api/tasks](http://localhost:8080/api/tasks). Stop the services with `Ctrl+C`, then run `docker compose down` to remove containers. The named MySQL volume is retained; use `docker compose down -v` only when you also want to delete the local database.

Compose uses development-only credentials by default. Override `MYSQL_ROOT_PASSWORD` and `MYSQL_PASSWORD` in your environment before using it anywhere other than a local development machine.

## Run without Docker

Requirements: Node.js 20.19.x, 22.12+, or 24+, Java 17+, Maven 3.9+, and a MySQL 8 server.

1. Create a database named `todo_db` and set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` for the backend.
2. In `backend`, run `mvn spring-boot:run`.
3. In `frontend`, run `npm install` and `npm start`.
4. Open [http://localhost:4200](http://localhost:4200).

The Angular development server proxies `/api` requests to `http://localhost:8080`.

## Kubernetes with Minikube

Requirements: Docker, kubectl, and Minikube.

From the project root, build the images into Minikube's image store and apply the manifests:

```powershell
minikube start
minikube image build -t todo-backend:latest ./backend
minikube image build -t todo-frontend:latest ./frontend
kubectl apply -k k8s/
kubectl get pods,services -n todo
minikube service frontend -n todo
```

The frontend service is also exposed as a NodePort on `30080`. Kubernetes manifests include a MySQL persistent volume claim, application ConfigMap, and a Secret containing clearly marked local-development credentials. Replace the values in `k8s/secret.yaml` before using this setup outside a local cluster; for production, provision secrets through a secure secrets manager.

To remove the Kubernetes resources:

```powershell
kubectl delete -k k8s/
```

## API

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/tasks` | List tasks |
| `GET` | `/api/tasks/{id}` | Get one task |
| `POST` | `/api/tasks` | Create a task |
| `PUT` | `/api/tasks/{id}` | Update a task |
| `PATCH` | `/api/tasks/{id}/toggle` | Toggle completion |
| `DELETE` | `/api/tasks/{id}` | Delete a task |

Task priorities are `LOW`, `MEDIUM`, and `HIGH`.
