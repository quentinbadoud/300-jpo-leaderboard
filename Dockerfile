# Étape unique : image Nginx très légère
FROM nginx:alpine

# Supprime la page d'accueil par défaut
RUN rm -rf /usr/share/nginx/html/*

# Copie des ressources statiques dans le dossier web de Nginx
# On renomme jpo-300.html en index.html pour qu'elle soit servie par défaut
COPY jpo-300.html /usr/share/nginx/html/index.html
COPY jpo-300.js   /usr/share/nginx/html/

# (Optionnel) headers simples de cache via un conf additionnel
# Désactive un cache agressif pour faciliter le dev
RUN printf 'server {\n\
    listen 80;\n\
    server_name _;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri $uri/ =404;\n\
        add_header Cache-Control "no-store";\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

# Nginx écoute sur 80
EXPOSE 80

# Démarrage Nginx (déjà CMD dans l'image de base)