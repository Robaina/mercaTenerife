"""
Web-scrape daily prices from Mercatenerife
"""
import requests
import json
from bs4 import BeautifulSoup
from subprocess import call

workDir = 'C:/Users/tinta/OneDrive/Documents/Projects/Datos_Mercatenerife/'

# Download new data file
data = {}
url = 'https://mercatenerife.com/precios_frame.php?l=1'
myfile = requests.get(url)
soup = BeautifulSoup(myfile.text, 'html.parser')
products = soup.find_all('tr')[1:]

for product in products:
    code = product.select('td')[0].text.strip()
    name = product.select('td')[1].text.strip()
    if product.select('td')[2].text.lower().strip() == 'local':
        origen = 'local'
    else:
        origen = 'impor'
    min_price = product.select('td')[3].text.strip()
    max_price = product.select('td')[4].text.strip()
    mode_price = product.select('td')[5].text.strip()

    if code not in data.keys():
        data[code] = {}
        data[code]['name'] = name
    data[code][origen] = {'min': min_price, 'max': max_price, 'moda': mode_price}

with open(workDir + 'daily_prices.json', 'w') as outfile:
    outfile.write("daily_prices = ")
    json.dump(data, outfile)

# Push commit
call(['git', 'add', 'daily_prices.json'], cwd=workDir)
call(['git', 'commit', '-m', '"Update data"'], cwd=workDir)
call(['git', 'push', 'origin', 'master'], cwd=workDir)
