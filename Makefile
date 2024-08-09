run-oauth2: 
	docker run -v ~/misc/nsaas-demo/oauth2-proxy-nginx.cfg:/site_config/oauth2-proxy.cfg \
		-p 4180:4180 \
		quay.io/oauth2-proxy/oauth2-proxy:v7.6.0-alpine \
		--config=/site_config/oauth2-proxy.cfg

run-nginx: # #~/misc/nsaas-demo/nginx-conf:/etc/nginx/conf.d/default.conf
	docker run -v  ~/misc/nsaas-demo/nginx-conf:/etc/nginx \
		-p 80:80 \
		nginx:1.27.0

run-jupyterlab:
	docker run -v ~/jupyter_work_dir:/home/jovyan/work \
		-p 8888:8888 \
		quay.io/jupyter/base-notebook start-notebook.py --NotebookApp.token=''

.PHONY: up
up:
	docker compose up -d

.PHONY: %
%:
	docker compose $*
