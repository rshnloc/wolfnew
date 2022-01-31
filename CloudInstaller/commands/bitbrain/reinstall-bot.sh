#!/bin/bash
#interactive

sudo su -
kill -9 `ps -ef | grep bitbrain1 | grep -v grep | awk '{print $2}'`
userdel -f bitbrain1
rm -Rf /home/bitbrain1
rm /var/spool/cron/crontabs/bitbrain1

# reinstall the 1st user account
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
echo "{\"id\": 1, \"url\": \"https://dummy-aws.wolfbot.org:8443\"}" > sensorConfig.json

cd /home/bitbrain1/nodejs/BitBrain1/
wget https://wolfbot.org/pub/shell/restart-premium1.sh
chmod u+x restart-premium1.sh
# still existing
crontab -l | { cat; echo "* * * * * /home/bitbrain1/nodejs/BitBrain1/restart-premium1.sh >/dev/null 2>&1"; } | crontab -

exit

#chown bitbrain1:crontab /var/spool/cron/crontabs/bitbrain1
service cron reload

exit # exit root user
