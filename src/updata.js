var OSS = require('ali-oss');
var writeFile = require('./downData');

var client = new OSS({
  accessKeyId: 'LTAIxGrbAO9cD0lj',
  accessKeySecret: 's8giJOlrSrBm73KohGGCfBtnwQlolv',
  bucket:'traile',
  endpoint:'oss-cn-shenzhen.aliyuncs.com'
});
function upDate(url,bid){
  return writeFile.downHttpData(url,'binary').then(function(stra){
    return client.putStream('xiaoshuo/'+bid+"_"+stra.fileName,stra.dup).then(function(res){
      return res;
    }).catch(err=>{
      console.log(err);
    });
  });
}


module.exports = upDate;