class getProx{
  constructor(){
    this.puppeteer = require('puppeteer');
    this.url = 'https://ip.seofangfa.com/';
  }
  async defineBrowser(){
    this.browser = await this.puppeteer.launch({headless:true});
  }
  async getProxIp(){
    let page = await this.browser.newPage();
    await page.goto(this.url);
    await page.addScriptTag({
      path:'./src/bin/jquery.min.js'
    });
    let proxData = await page.evaluate(async ()=>{
      var td = $(".table tbody tr"),len = td.length,tempData = [];
      for(var s = 0;s<td.length;s++){
        tempData.push('http://'+$(td[s]).find('td').eq(0).text()+':'+$(td[s]).find('td').eq(1).text());
      }
      return tempData;
    });
    await this.browser.close();
    return proxData;
  }
}

(async()=>{
  let c = new getProx();
  await c.defineBrowser();
  await c.getProxIp();
})()