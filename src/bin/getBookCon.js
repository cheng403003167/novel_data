class crawlCon {
  constructor({name='',startChapter=0,needGetChapter=0}){
    this.chapterData = [];
    this.bookName = name;
    this.bookEnd = 0;
    this.hasChapter = 0;
    this.startChapter = parseInt(startChapter);
    this.needGetChapter = needGetChapter;
    this.endGetChapter = this.startChapter + this.needGetChapter;
    this.puppeteer = require('puppeteer');
    this.url = 'https://www.biquge5200.cc/modules/article/search.php?searchkey='+this.bookName;
  }
  async defineBrowser(){
    this.browser = await this.puppeteer.launch({headless:false});
  }
  // 搜索书籍信息
  async getsouDate(){
    this.conPage = await this.browser.newPage();
    await this.conPage.goto(this.url);
    await this.souBook();
    if(this.bookEnd == 0){
      await this.getCon();
      await this.criclGetData();
    }else{
      return false;
    }
  }
  async getOtherCric(startChapter,needGetChapter){
    this.startChapter = parseInt(startChapter);
    this.needGetChapter = needGetChapter;
    this.endGetChapter = this.startChapter + this.needGetChapter;
    await this.criclGetData();
    this.chapterData = this.chapterData.filter((item,index,arr)=>{
      if(arr.length>10 && index>=10){
        return item;
      }
    })
  }
  async souBook(){
    let dataLine = await this.conPage.evaluate(()=>{
      if($(".grid tr").eq(1)){
        return $(".grid tr").eq(1).find('.odd').eq(0).find('a').attr('href');
      }else{
        return false;
      }
    });
    await this.gotoCon(dataLine,this.startChapter);
  }
  // 去书籍内容页
  async gotoCon(dataLine,startChapter){
    if(dataLine){
      await this.conPage.goto(dataLine);
      dataLine = await this.conPage.evaluate((startChapter)=>{
        $("#adt2").parent().prevAll('dd').remove();
        $("#adt2").parent().prevAll('dt').remove();
        $("#adt2").parent().next('dt').remove();
        $("#adt2").parent().remove();
        if(startChapter < $("#list dl dd").length){
          return {
            href: $("#list dl dd").eq(startChapter).find('a').attr('href'),
            hasChapter: $("#list dl dd").length
          }
        }else{
          return false;
        }
      },startChapter);
      if(dataLine){
        this.hasChapter = dataLine.hasChapter;
        if(this.endGetChapter > dataLine.hasChapter){
          this.endGetChapter = dataLine.hasChapter;
        }
        await this.conPage.goto(dataLine.href);
        this.bookEnd = 0;
      }else{
        this.bookEnd = 1;
      }
    }
  }
  // 循环获取书籍内容
  async criclGetData(){
    if(this.startChapter > this.endGetChapter){
      this.chapterData = [];
      return false;
    }
    if(this.startChapter >= this.hasChapter){
      this.bookEnd = 1;
      return false;
    }
    if(this.startChapter < this.endGetChapter){
      await this.conPage.evaluate(()=>{
        $(".bottem1 a").eq(3).addClass("toNext");
      })
      await Promise.all([
        this.conPage.waitForNavigation(),
        this.conPage.click('.toNext')
      ]).then(async ()=>{
        await this.getCon();
        await this.criclGetData();
      });
    }
  }
  // 获取书籍内容
  async getCon(){
    let judge = await this.conPage.evaluate((startChapter)=>{
      if($("#list")){
        startChapter++;
        $("#adt2").parent().prevAll('dd').remove();
        $("#adt2").parent().prevAll('dt').remove();
        $("#adt2").parent().next('dt').remove();
        $("#adt2").parent().remove();
        if(startChapter < $("#list dl dd").length){
          return {
            href: $("#list dl dd").eq(startChapter).find('a').attr('href')
          }
        }else{
          return {href:''}
        }
      }else{
        return {href:''}
      }
    },this.startChapter);
    if(judge.href != ''){
      await this.conPage.goto(judge.href);
    }
    let chapterName = await this.conPage.$eval('h1',(node)=>{return node.innerText});
    await this.conPage.waitForSelector('#content').catch(async (err)=>{if(err){console.log(err);await this.conPage.reload();await this.getCon();}})
    let chapterCon = await this.conPage.$eval('#content',(node)=>{return node.innerHTML});
    if(chapterCon){
      this.chapterData.push({name:this.bookName,chapter_num:this.startChapter,chapter_name:chapterName,chapter_con:chapterCon});
      this.startChapter++;
    }
  }
  // 书完了后清除数据，但最好在插入数据库后调用
  cleanData(){
    this.chapterData = [];
  }
  // 关闭程序
  async closeBrowser(){
    await this.browser.close();
  }
}
module.exports = crawlCon;

// (async ()=>{
//   const onePage = new crawlCon({name:'牧神记',startChapter:0,needGetChapter:1});
//   await onePage.defineBrowser();
//   await onePage.getsouDate();
// })()
