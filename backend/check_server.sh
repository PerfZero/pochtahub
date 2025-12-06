#!/bin/bash

echo "=== Проверка статуса сервиса pochtahub ==="
systemctl status pochtahub.service --no-pager -l

echo ""
echo "=== Последние 50 строк логов сервиса ==="
journalctl -u pochtahub.service -n 50 --no-pager

echo ""
echo "=== Проверка процесса Django ==="
ps aux | grep "manage.py runserver" | grep -v grep

echo ""
echo "=== Последние 50 строк server.log ==="
if [ -f /var/www/pochtahub/server.log ]; then
    tail -n 50 /var/www/pochtahub/server.log
else
    echo "Файл server.log не найден"
fi

echo ""
echo "=== Проверка порта 8000 ==="
netstat -tlnp | grep 8000 || ss -tlnp | grep 8000

echo ""
echo "=== Проверка доступности API ==="
curl -s -o /dev/null -w "HTTP код: %{http_code}\n" http://localhost:8000/api/ || echo "API не отвечает"

echo ""
echo "=== Проверка ошибок в логах за последний час ==="
journalctl -u pochtahub.service --since "1 hour ago" | grep -i error | tail -n 20





