/*
    SPDX-License-Identifier: Apache-2.0
*/

var co = require('co')
var helper = require('../helper.js');
var logger = helper.getLogger('blocks');
var sql = require('../db/mysqlservice.js');

function getBlockAndTxList(channelName, blockNum) {

    let sqlBlockTxList = ` select blocks.*,(
     SELECT  group_concat(txhash) FROM transaction where blockid = blocks.blocknum
     group by transaction.blockid ) as txhash
     from blocks where
     blocks.channelname ='${channelName}' and blocknum >= ${blockNum}
     order by blocks.blocknum desc`;
    return sql.getRowsBySQlQuery(sqlBlockTxList);

  }

exports.getBlockAndTxList = getBlockAndTxList
