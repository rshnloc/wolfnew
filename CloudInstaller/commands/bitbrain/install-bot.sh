#!/bin/bash
#interactive

apt-get update
apt-get install build-essential tcl curl htop rdate autossh -y
apt-get install gcc g++ make flex bison openssl libssl-dev perl -y
apt-get install perl-base perl-modules libperl-dev libaio1 libaio-dev -y
apt-get install zlib1g zlib1g-dev libcap-dev cron bzip2 automake -y
apt-get install autoconf libtool cmake pkg-config python libdb-dev libsasl2-dev -y
apt-get install libncurses5-dev libsystemd-dev bind9 dnsutils -y
apt-get install quota patch libjemalloc-dev logrotate rsyslog libc6-dev libexpat1-dev -y
apt-get install libcrypt-openssl-rsa-perl libnuma-dev libnuma1 bsd-mailx git -y

# headless chrome dependencies
apt install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget

curl -sL https://deb.nodesource.com/setup_12.x | bash -
apt-get install nodejs -y
node -v
which node
ln -s /usr/bin/node /usr/local/bin/node

curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
apt-get update
apt-get install yarn -y
yarn config set workspaces-experimental true

mkdir -p /root/.ssh
chmod 0700 /root/.ssh
ssh-keygen -t rsa -b 4096 -N '' -f /root/.ssh/id_rsa
ssh-copy-id -i /root/.ssh/id_rsa.pub sshtunnel@dbx.wolfbot.org
yes
nADSnkl349ouSFu09F
autossh -f sshtunnel@dbx.wolfbot.org -L 27017:localhost:27017 -N

# https://stackoverflow.com/questions/878600/how-to-create-a-cron-job-using-bash-automatically-without-the-interactive-editor
crontab -l | { cat; echo "14 22 * * * rdate -s time.fu-berlin.de"; } | crontab -

cd /etc/systemd/system/
wget https://wolfbot.org/pub/shell/rc-local.service
cd /etc/
wget https://wolfbot.org/pub/shell/rc.local
chmod +x /etc/rc.local
systemctl enable rc-local
systemctl daemon-reload


# install the 1st user account
useradd bitbrain1 --create-home --shell=/bin/bash
su bitbrain1
cd /home/bitbrain1
yarn config set workspaces-experimental true
export NPM_TOKEN="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"

mkdir -p /home/bitbrain1/nodejs/BitBrain1/Sensor1
cd /home/bitbrain1/nodejs/BitBrain1/Sensor1
wget https://tradebot:SFlw3h42l34jhljljlr5345@staydown.co/updater/Sensor.tar.gz
tar xzf Sensor.tar.gz
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc
yarn install --production
echo "1" > premium.txt

mkdir -p /home/bitbrain1/nodejs/BitBrain1/Sensor_monitor
cd /home/bitbrain1/nodejs/BitBrain1/Sensor_monitor
wget https://tradebot:SFlw3h42l34jhljljlr5345@staydown.co/updater/Sensor.tar.gz
tar xzf Sensor.tar.gz
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc
yarn install --production
echo "1" > premium.txt
cd /home/bitbrain1/nodejs/BitBrain1
echo "{\"id\": 3, \"url\": \"https://bud39fk.wolfbot.org:8443\"}" > sensorConfig.json

cd /home/bitbrain1/nodejs/BitBrain1/
wget https://wolfbot.org/pub/shell/restart-premium1.sh
chmod u+x restart-premium1.sh
crontab -l | { cat; echo "* * * * * /home/bitbrain1/nodejs/BitBrain1/restart-premium1.sh >/dev/null 2>&1"; } | crontab -

exit


# install the 2nd user account
useradd bitbrain2 --create-home --shell=/bin/bash
su bitbrain2
cd /home/bitbrain2
yarn config set workspaces-experimental true
export NPM_TOKEN="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"

mkdir -p /home/bitbrain2/nodejs/BitBrain2/Sensor1
cd /home/bitbrain2/nodejs/BitBrain2/Sensor1
wget https://tradebot:SFlw3h42l34jhljljlr5345@staydown.co/updater/Sensor.tar.gz
tar xzf Sensor.tar.gz
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc
yarn install --production
echo "1" > premium.txt

mkdir -p /home/bitbrain2/nodejs/BitBrain2/Sensor_monitor
cd /home/bitbrain2/nodejs/BitBrain2/Sensor_monitor
wget https://tradebot:SFlw3h42l34jhljljlr5345@staydown.co/updater/Sensor.tar.gz
tar xzf Sensor.tar.gz
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc
yarn install --production
echo "1" > premium.txt
cd /home/bitbrain2/nodejs/BitBrain2
echo "{\"id\": 18, \"url\": \"https://CURRENT_TIMESTAMP.wolfbot.org:2096\"}" > sensorConfig.json

cd /home/bitbrain2/nodejs/BitBrain2/
wget https://wolfbot.org/pub/shell/restart-premium2.sh
chmod u+x restart-premium2.sh
crontab -l | { cat; echo "* * * * * /home/bitbrain2/nodejs/BitBrain2/restart-premium2.sh >/dev/null 2>&1"; } | crontab -

exit
