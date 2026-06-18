FROM busybox:latest
COPY dist /usr/share/nginx/html
CMD ["httpd", "-f", "-p", "3000", "-h", "/usr/share/nginx/html"]
