const https = require('https');
const http = require('http');
const path = require('path');
const duplex = require('./duplex')

class GetWebData {
    downHttpData(url,encoding,fileName=null){
        if(url.startsWith('http:')){
            return this.getOthHttp(url,encoding,fileName);
        }else if(url.startsWith('https:')){
            return this.getOthHttps(url,encoding,fileName)
        }
    }
    getOthHttp(url,encoding,fileName=null){
        if(!fileName){
            fileName = path.basename(url);
        }
        return new Promise(function(resolve){
            http.get(url,(res)=>{
                var Data = '';
                res.setEncoding(encoding);
                res.on('data',(d)=>{
                    Data += d;
                }).on('end',()=>{
                    var dup = new duplex();
                    dup.write(Data,'binary');
                    resolve({fileName,dup});
                })
            })
        })
        
    }
    getOthHttps(url,encoding,fileName=null){
        if(!fileName){
            fileName = path.basename(url);
        }
        return new Promise(function(resolve){
            https.get(url,(res)=>{
                var Data = '';
                res.setEncoding(encoding);
                res.on('data',(d)=>{
                    Data += d;
                }).on('end',()=>{
                    var dup = new duplex();
                    dup.write(Data,'binary');
                    resolve({fileName,dup});
                })
            })
        })
    }
    writeStream(Data,fileName,encoding){
    }
}

var s = new GetWebData();
module.exports = s;