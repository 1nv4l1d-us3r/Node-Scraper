crtsh(){
touch all.txt; touch  resolved.txt
new=$(curl -s https://crt.sh?q=$1\&output\=json | jq -r .[].name_value |sed 's/\*.//g' | sed 's/www.//g' | sort -u)
echo "$new" |sort -u all.txt - -o all.txt
alive=$(echo  "$new" | httprobe )
echo "$alive" |sort -u resolved.txt - -o resolved.txt
echo "$new"
}
certspotter(){
touch all.txt; touch resolved.txt
new=$(curl -s -u xyz: https://api.certspotter.com/v1/issuances?domain=$1\&expand=dns_names\&include_subdomains=$2  |jq -r '.[].dns_names[]' | sed 's/\*.//g' |sed 's/www\.//g'| grep $1 |  sort -u)
echo "$new" |sort -u all.txt - -o all.txt
alive=$(echo  "$new" | httprobe )
echo "$alive" |sort -u resolved.txt - -o resolved.txt
echo "$new"
}
scrape(){
node  ~/node/index.js $1
}
showimages(){
node ~/node/createImgPage.js
}
