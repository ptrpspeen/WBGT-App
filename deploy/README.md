# WBGT Kubernetes Deploy Template

This folder contains Argo CD / Kubernetes Gateway API templates for deploying the WBGT app.

## Routing

- `https://wbgt.sut.ac.th/` routes to the frontend service.
- `https://wbgt.sut.ac.th/api/*` routes to the backend service and rewrites `/api/predict-wbgt` to `/predict-wbgt`.

## Values to edit

Edit `deploy/overlays/prod/patch-http-route-gateway.yaml`:

```yaml
spec:
  parentRefs:
    - group: gateway.networking.k8s.io
      kind: Gateway
      name: production-gateway-01
      namespace: default
```

Edit image tags in `deploy/overlays/prod/kustomization.yaml` after CI pushes images:

```yaml
images:
  - name: ghcr.io/ptrpspeen/wbgt-backend
    newTag: <git-sha>
  - name: ghcr.io/ptrpspeen/wbgt-frontend
    newTag: <git-sha>
```

## Frontend image build arguments

For `wbgt.sut.ac.th`, build the frontend with:

```bash
docker build \
  --build-arg VITE_BASE_PATH=/ \
  --build-arg VITE_WBGT_API_BASE_URL=/api \
  -t ghcr.io/ptrpspeen/wbgt-frontend:<git-sha> \
  frontend
```

The backend image continues to use `backend/Dockerfile` and listens on port `10000`.
