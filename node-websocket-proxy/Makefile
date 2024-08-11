build-node-proxy:
	docker build --no-cache \
	-t node-websocket-proxy:latest \
	-f ./Dockerfile .

run-node-proxy:
	docker run --rm -it -p 8891:8891 --name node-websocket-proxy \
	node-websocket-proxy:latest