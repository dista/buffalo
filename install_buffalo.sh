# change apt source to 163

apt-get install build-essential mysql-server mysql-client git vim exuberant-ctags
mysql -e "CREATE USER 'buffalo'@'localhost' IDENTIFIED BY PASSWORD 'buffalo'"
mysql -e "GRANT ALL ON buffalo.* TO 'buffalo'@'localhost'"

wget http://nodejs.org/dist/v0.10.21/node-v0.10.21.tar.gz
tar -x node-v0.10.21.tar.gz
(cd node-v0.10.21 && ./configure && make install)
git clone https://github.com/dista/buffalo.git
(cd buffalo && npm install)

# next add device data to mysql
