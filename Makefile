run-oauth2: 
	docker run -v ~/misc/nginx-oauth2-proxy/oauth2-proxy-nginx.cfg:/site_config/oauth2-proxy.cfg \
		-p 4180:4180 \
		quay.io/oauth2-proxy/oauth2-proxy:v7.6.0-alpine \
		--config=/site_config/oauth2-proxy.cfg

run-nginx:
	docker run -v ~/misc/oauth2-proxy/nginx.conf:/etc/nginx/conf.d/default.conf \
		-p 80:80 \
		nginx:1.27.0

.PHONY: up
up:
	docker compose up -d

.PHONY: %
%:
	docker compose $*
