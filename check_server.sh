#!/usr/bin/expect -f
set timeout 30
spawn ssh -o StrictHostKeyChecking=no root@109.172.46.96
expect "password:"
send "eN0*G!MPKIQD\r"
expect "# "
send "cd /var/www/pochtahub/backend && source ../venv/bin/activate && systemctl status pochtahub --no-pager -l | head -50\r"
expect "# "
send "tail -50 /var/www/pochtahub/server.log\r"
expect "# "
send "exit\r"
expect eof






