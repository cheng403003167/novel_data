const EventEmitter = require('events');
class crawlCon extends EventEmitter {
  constructor({name='',startChapter=0,chapterStep=10}){
    super();
    this.chapterData = [];
    this.bookName = name;
    this.hasChapter = 0;
    this.hrefList = [];
    this.bookEnd = 0;
    this.startChapter = parseInt(startChapter);
    this.indexChapter = 0;
    this.chapterStep = chapterStep || 10;
    this.puppeteer = require('puppeteer');
    this.url = 'https://www.biquge5200.cc/modules/article/search.php?searchkey='+this.bookName;
  }
  async defineBrowser(){
    this.browser = await this.puppeteer.launch({headless:false,args:['--proxy-server=http://111.177.161.211:9999']});
  }
  // 搜索书籍信息
  async getsouDate(){
    this.conPage = await this.browser.newPage();
    // await this.conPage.goto('http://www.baidu.com');
    await this.conPage.goto(this.url).catch(async (err)=>{
      console.log('搜索书籍页出错');
      await this.conPage.close();
      await this.getsouDate();
    });
    await this.souBook();
  }
  async souBook(){
    await this.conPage.addScriptTag({
      path:'./src/bin/jquery.min.js'
    })
    let dataLine = await this.conPage.evaluate(async (bookName)=>{
      let bookLength = $(".grid tr").length;
      if($(".grid tr").eq(1).length == 1){
        for(let i = 1;i<bookLength;i++){
          if($(".grid tr").eq(i).find('.odd').eq(0).text() == bookName){
            return $(".grid tr").eq(i).find('.odd').eq(0).find('a').attr('href');
          }
        }
      }else{
        return false;
      }
    },this.bookName);
    await this.gotoCon(dataLine,this.startChapter);
  }
  // 去书籍内容页
  async gotoCon(dataLine,startChapter){
    if(dataLine){
      await this.conPage.goto(dataLine);
      await this.conPage.addScriptTag({
        path:'./src/bin/jquery.min.js'
      })
      let bookInfo = await this.conPage.evaluate((startChapter)=>{
        $("#adt2").parent().prevAll('dd').remove();
        $("#adt2").parent().prevAll('dt').remove();
        $("#adt2").parent().next('dt').remove();
        $("#adt2").parent().remove();
        if(startChapter < $("#list dl dd").length){
          var hasChapter = $("#list dl dd").length;
          var hrefList = [];
          for(var chapterItem = startChapter;chapterItem<hasChapter;chapterItem++){
            hrefList.push($("#list dl dd").eq(chapterItem).find('a').attr('href'))
          }
          return {
            hrefList: hrefList,
            hasChapter: hasChapter
          }
        }else{
          return false;
        }
      },startChapter);
      if(bookInfo.hrefList && bookInfo.hrefList.length>0){
        this.hasChapter = bookInfo.hasChapter;
        this.hrefList = bookInfo.hrefList;
        await this.getCon();
      }else{
        this.bookEnd = 1;
        this.emitEvent('partCom');
        return false;
      }
    }else{
      this.bookEnd = 1;
      this.emitEvent('partCom');
      return false;
    }
  }
  // 获取书籍内容
  async getCon(){
    let chapterPage = await this.browser.newPage();
    do{
      await chapterPage.goto(this.hrefList[this.indexChapter]).catch(async (err)=>{if(err){console.log('去内容页出错');await chapterPage.reload();}});
      await chapterPage.waitForSelector('#content').catch(async (err)=>{if(err){console.log('内容页加载时间太长');await chapterPage.reload();}});
      let chapterName = await chapterPage.$eval('h1',(node)=>{return node.innerText});
      let chapterCon = await chapterPage.$eval('#content',(node)=>{return node.innerHTML}).catch((err)=>{return '无内容'})
      this.chapterData.push({name:this.bookName,chapter_num:this.indexChapter+this.startChapter,chapter_name:chapterName,chapter_con:chapterCon});
      this.indexChapter++;
      if(this.indexChapter+this.startChapter >= this.hasChapter){
        this.bookEnd = 1;
        await chapterPage.close();
        this.emitEvent('partCom');
        break;
      }
      if(this.indexChapter+this.startChapter>=this.hasChapter || this.chapterData.length == this.chapterStep){
        await chapterPage.close();
        this.emitEvent('partCom');
        break;
      }
    }while(this.indexChapter)
  }
  async defineEvent(eventName,cb){
    this.on(eventName,cb);
  }
  async emitEvent(eventName){
    this.emit(eventName)
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
//   const onePage = new crawlCon({name:'牧神记',startChapter:0,needGetChapter:10});
//   onePage.defineEvent('partCom',async ()=>{
//     console.log(onePage.startChapter+'到'+(onePage.currentChapter)+'完成');
//     await onePage.cleanData();
//     onePage.emit('startGet');
//   });
//   await onePage.defineBrowser();
//   await onePage.getsouDate();
// })()
