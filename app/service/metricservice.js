/*
 Copyright ONECHAIN 2017 All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

var co = require('co')
var helper = require('../helper.js');
var query = require('../query.js');
var logger = helper.getLogger('metricservice');
var sql = require('../db/mysqlservice.js');

var peerList;

//==========================query counts ==========================
function getChaincodeCount(channelName) {
  return sql.getRowsBySQlCase(`select count(1) c from chaincodes where channelname='${channelName}' `)
}

function getPeerlistCount(channelName) {
  return sql.getRowsBySQlCase(`select count(1) c from peer where name='${channelName}' `)
}

function getTxCount(channelName) {
  return sql.getRowsBySQlCase(`select count(1) c from transaction where channelname='${channelName}'`)
}

function getBlockCount(channelName) {
  return sql.getRowsBySQlCase(`select max(blocknum) c from blocks where channelname='${channelName}'`)
}

function* getPeerData(channelName) {
  let peerArray = []
  var c1 = yield sql.getRowsBySQlNoCondtion(`select c.name as name,c.requests as requests,c.server_hostname as server_hostname from peer c where c.name='${channelName}'`);
  for (var i = 0, len = c1.length; i < len; i++) {
    var item = c1[i];
    peerArray.push({ 'name': item.channelname, 'requests': item.requests, 'server_hostname': item.server_hostname })
  }
  return peerArray
}

function* getTxPerChaincodeGenerate(channelName) {
  let txArray = []
  var c = yield sql.getRowsBySQlNoCondtion(`select c.channelname as channelname,c.name as chaincodename,c.version as version,c.path as path ,txcount  as c from chaincodes c where  c.channelname='${channelName}' `);
  c.forEach((item, index) => {
    txArray.push({ 'channelName': item.channelname, 'chaincodename': item.chaincodename, 'path': item.path, 'version': item.version, 'txCount': item.c })
  })
  return txArray

}

function getTxPerChaincode(channelName, cb) {
  co(getTxPerChaincodeGenerate, channelName).then(txArray => {
    cb(txArray)
  }).catch(err => {
    logger.error(err)
    cb([])
  })
}

function* getStatusGenerate(channelName) {
  var chaincodeCount = yield getChaincodeCount(channelName)
  if (!chaincodeCount) chaincodeCount = 0
  var txCount = yield getTxCount(channelName)
  if (!txCount) txCount = 0
  var blockCount = yield getBlockCount(channelName)
  if (!blockCount) blockCount = 0
  blockCount.c = blockCount.c ? blockCount.c : 0
  var peerCount = yield getPeerlistCount(channelName)
  if (!peerCount) peerCount = 0
  peerCount.c = peerCount.c ? peerCount.c : 0
  return { 'chaincodeCount': chaincodeCount.c, 'txCount': txCount.c, 'latestBlock': blockCount.c, 'peerCount': peerCount.c }
}

function getStatus(channelName, cb) {
  co(getStatusGenerate, channelName).then(data => {
    cb(data)
  }).catch(err => {
    logger.error(err)
  })
}

function getPeerList(channelName, cb) {
  co(getPeerData, channelName).then(peerArray => {
    cb(peerArray)
  }).catch(err => {
    logger.error(err)
    cb([])
  })
}

//transaction metrics

function getTxByMinute(channelName, hours) {
  let sqlPerMinute = `  

SELECT
    test as datetime,
  	today_order_count as count 
  	
  	FROM(
	SELECT
	   ts time,
	  sum(IFNULL(today.order_count, 0)) today_order_count,
	str_to_date ( concat (STR_TO_DATE(now(),'%Y-%m-%d'),' ', STR_TO_DATE( ts ,'%H:%i:00')),'%Y-%m-%d %H:%i:00') as test
	FROM
	  (
	    SELECT t ts
	    FROM timestamp_table where t between date_format((now() - interval 1 hour),' %H:%i:00') and date_format (now(), '%H:%i:00')
		 #date_format(now(), '%Y-%m-%d %H:%i:00' ) and date_format(now()- interval 60 minute, '%Y-%m-%d %H:%i: 00' )
	  ) time
	  #날짜 조건
	  
	LEFT OUTER JOIN
	  (
	    SELECT time(from_unixtime(unix_timestamp(timestamp(createdt))  - unix_timestamp(timestamp(createdt))  % 60)) rd,
	           count(*) order_count
	           # 생성 날짜 
	           , date_format(createdt,'%Y-%m-%d %H:%i:00') 
	    FROM transaction
	#WHERE unix_timestamp(timestamp(date(createdt), '00:00:00'))  BETWEEN unix_timestamp(timestamp(date(now()), '00:00:00')) and unix_timestamp(timestamp(date(now()), '23:59:59'))
	WHERE createdt and channelname = '${channelName}' BETWEEN (date_format( (NOW() - interval ${hours} hour ), '%Y-%m-%d %H:%i:00')) AND (date_format( now() , '%Y-%m-%d %H:%i:00'))
	 GROUP BY rd
	  ) today
	  ON (time.ts = today.rd)
	GROUP BY unix_timestamp(timestamp(date(now()), time)) DIV 60) AS A;;
                      `;
  /*
  ` with minutes as (
        select generate_series(
          date_trunc('min', now()) - '${hours}hour'::interval,
          date_trunc('min', now()),
          '1 min'::interval
        ) as datetime
      )
      select
        minutes.datetime,
        count(createdt)
      from minutes
      left join TRANSACTION on date_trunc('min', TRANSACTION.createdt) = minutes.datetime and channelname ='${channelName}'
      group by 1
      order by 1 `;
*/
  return sql.getRowsBySQlQuery(sqlPerMinute);
}

function getTxByHour(channelName, day) {
  let sqlPerHour = ` SELECT
    test as datetime, 
  	today_order_count as count 
  	
  	FROM(
	SELECT
	   ts time,
	  sum(IFNULL(today.order_count, 0)) today_order_count,
	str_to_date( concat (STR_TO_DATE(now(),'%Y-%m-%d'),' ', STR_TO_DATE( ts ,'%H:%i:00')),'%Y-%m-%d %H:%i:00' ) as test
	FROM
	  (
	    SELECT t ts
	    FROM timestamp_table where t between '00:00:00' and '25:00:00'
		 #date_format(now(), '%Y-%m-%d %H:%i:00' ) and date_format(now()- interval day, '%Y-%m-%d %H:%i: 00' )
	  ) time
	  #날짜 조건
	  
	LEFT OUTER JOIN
	  (
	    SELECT time(from_unixtime(unix_timestamp(timestamp(createdt))  - unix_timestamp(timestamp(createdt))  % 60)) rd,
	           count(*) order_count
	           # 생성 날짜 
	           , date_format(createdt,'%Y-%m-%d %H:%i:00') 
	    FROM transaction
	#WHERE unix_timestamp(timestamp(date(createdt), '00:00:00'))  BETWEEN unix_timestamp(timestamp(date(now()), '00:00:00')) and unix_timestamp(timestamp(date(now()), '23:59:59'))
	WHERE createdt and channelname = '${channelName}' BETWEEN (date_format( (NOW() - interval ${day} day ), '%Y-%m-%d %H:%i:00')) AND (date_format( now() , '%Y-%m-%d %H:%i:00'))
	 GROUP BY rd
	  ) today
	  ON (time.ts = today.rd) 
	GROUP BY unix_timestamp(timestamp(date(now()), time)) DIV 3600) AS A;
` 
    return sql.getRowsBySQlQuery(sqlPerHour);
}

function getTxByDay(channelName, days) {
  let sqlPerDay = `SELECT createdt 
                   FROM transaction
                   where channelname = '${channelName}' and createdt > date_sub(now(), interval  '${days}' days)
                   group by 1
                   order by 1`;
  return sql.getRowsBySQlQuery(sqlPerDay);
}

function getTxByWeek(channelName, weeks) {
  let sqlPerWeek =`SELECT createdt 
                   FROM transaction
                   where channelname = '${channelName}' and createdt > date_sub(now(), interval  '${weeks}' week)
                   group by 1
                   order by 1 `;
  return sql.getRowsBySQlQuery(sqlPerWeek);
}

function getTxByMonth(channelName, months) {
  let sqlPerMonth = `SELECT createdt
                     FROM transaction
                     where channelname = '${channelName}' and createdt > date_sub(now(), interval  '${months}' month)
                     group by 1
                     order by 1`;
  return sql.getRowsBySQlQuery(sqlPerMonth);
}

function getTxByYear(channelName, years) {
let sqlPerYear = `  Select createdt
                    FROM transaction
                    where channelname = '${channelName}' and createdt > date_sub(now(), interval  '${years}' year)
                    group by 1
                    order by 1`;
  return sql.getRowsBySQlQuery(sqlPerYear);
}

// block metrics API

function getBlocksByMinute(channelName, hours) {
let sqlPerMinute = ` 

SELECT
    test as datetime,
  	today_order_count as count 
  	
  	FROM(
	SELECT
	   ts time,
	  sum(IFNULL(today.order_count, 0)) today_order_count,
	str_to_date( concat (STR_TO_DATE(now(),'%Y-%m-%d'),' ', STR_TO_DATE( ts ,'%H:%i:00')), '%Y-%m-%d %H:%i:00') as test
	FROM
	  (
	    SELECT t ts
	    FROM timestamp_table where t between date_format((now() - interval 60 minute),' %H:%i:00') and date_format (now(), '%H:%i:00')
		 #date_format(now(), '%Y-%m-%d %H:%i:00' ) and date_format(now()- interval 60 minute, '%Y-%m-%d %H:%i: 00' )
	  ) time
	  #날짜 조건
	  
	LEFT OUTER JOIN
	  (
	    SELECT time(from_unixtime(unix_timestamp(timestamp(createdt))  - unix_timestamp(timestamp(createdt))  % 60)) rd,
	           count(*) order_count
	           # 생성 날짜 
	           , date_format(createdt,'%Y-%m-%d %H:%i:00') 
	    FROM blocks 
	#WHERE unix_timestamp(timestamp(date(createdt), '00:00:00'))  BETWEEN unix_timestamp(timestamp(date(now()), '00:00:00')) and unix_timestamp(timestamp(date(now()), '23:59:59'))
	WHERE createdt and channelname = '${channelName}' BETWEEN (date_format( (NOW() - interval ${hours} hour), '%Y-%m-%d %H:%i:00')) AND (date_format( now() , '%Y-%m-%d %H:%i:00'))
	 GROUP BY rd
	  ) today
	  ON (time.ts = today.rd)
	GROUP BY unix_timestamp(timestamp(date(now()), time)) DIV 60) AS A;;
    
    
    `
    
    return sql.getRowsBySQlQuery(sqlPerMinute);
}

function getBlocksByHour(channelName, day) {
  let sqlPerHour = `  

SELECT
    test as datetime, 
  	today_order_count as count 
  	
  	FROM(
	SELECT
	   ts time,
	  sum(IFNULL(today.order_count, 0)) today_order_count,
	str_to_date( concat (STR_TO_DATE(now(),'%Y-%m-%d'),' ', STR_TO_DATE( ts ,'%H:%i:00')),'%Y-%m-%d %H:%i:00' ) as test
	FROM
	  (
	    SELECT t ts
	    FROM timestamp_table where t between '00:00:00' and '25:00:00'
		 #date_format(now(), '%Y-%m-%d %H:%i:00' ) and date_format(now()- interval 60 minute, '%Y-%m-%d %H:%i: 00' )
	  ) time
	  #날짜 조건
	  
	LEFT OUTER JOIN
	  (
	    SELECT time(from_unixtime(unix_timestamp(timestamp(createdt))  - unix_timestamp(timestamp(createdt))  % 60)) rd,
	           count(*) order_count
	           # 생성 날짜 
	           , date_format(createdt,'%Y-%m-%d %H:%i:00') 
	    FROM transaction
	#WHERE unix_timestamp(timestamp(date(createdt), '00:00:00'))  BETWEEN unix_timestamp(timestamp(date(now()), '00:00:00')) and unix_timestamp(timestamp(date(now()), '23:59:59'))
	WHERE createdt and channelname = '${channelName}'  BETWEEN (date_format( (NOW() - interval ${day} day ), '%Y-%m-%d %H:%i:00')) AND (date_format( now() , '%Y-%m-%d %H:%i:00'))
	 GROUP BY rd
	  ) today
	  ON (time.ts = today.rd) 
	GROUP BY unix_timestamp(timestamp(date(now()), time)) DIV 3600) AS A;

                    ` ;
  return sql.getRowsBySQlQuery(sqlPerHour);
}

function getBlocksByDay(channelName, days) {
  let sqlPerDay = `SELECT createdt 
                   FROM transaction
                   where channelname = '${channelName}' and createdt > date_sub(now(), interval  '${days}' day)
                   group by 1
                   order by 1`;
  return sql.getRowsBySQlQuery(sqlPerDay);
}

function getBlocksByWeek(channelName, weeks) {
  let sqlPerWeek = `SELECT createdt 
                    FROM transaction
                    where channelname = '${channelName}' and createdt > date_sub(now(), interval  '${weeks}' week)
                    group by 1
                    order by 1`;
  return sql.getRowsBySQlQuery(sqlPerWeek);
}

function getBlocksByMonth(channelName, months) {
  let sqlPerMonth = `SELECT createdt 
                     FROM transaction
                     where channelname = '${channelName}' and createdt > date_sub(now(), interval  '${months}' month)
                     group by 1
                     order by 1`;
  return sql.getRowsBySQlQuery(sqlPerMonth);
}

function getBlocksByYear(channelName, years) {
  let sqlPerYear = `SELECT createdt 
                    FROM transaction
                    where channelname = '${channelName}' and createdt > date_sub(now(), interval  '${years}' year)
                    group by 1
                    order by 1`;
  return sql.getRowsBySQlQuery(sqlPerYear);
}

function getTxByOrgs(channelName) {
  let sqlPerOrg = ` select count(creator_msp_id), creator_msp_id
  from transaction
  where channelname ='${channelName}'
  group by  creator_msp_id`;

  return sql.getRowsBySQlQuery(sqlPerOrg);
}

exports.getStatus = getStatus
exports.getTxPerChaincode = getTxPerChaincode
exports.getPeerList = getPeerList
exports.getTxByMinute = getTxByMinute
exports.getTxByHour = getTxByHour
exports.getTxByDay = getTxByDay
exports.getTxByWeek = getTxByWeek
exports.getTxByMonth = getTxByMonth
exports.getTxByYear = getTxByYear
exports.getBlocksByMinute = getBlocksByMinute
exports.getBlocksByHour = getBlocksByHour
exports.getBlocksByDay = getBlocksByDay
exports.getBlocksByWeek = getBlocksByWeek
exports.getBlocksByMonth = getBlocksByMonth
exports.getBlocksByYear = getBlocksByYear
exports.getTxByOrgs = getTxByOrgs
