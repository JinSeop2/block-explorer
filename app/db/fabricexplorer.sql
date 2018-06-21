

DROP DATABASE IF EXISTS `fabricexplorer`;

CREATE DATABASE fabricexplorer;

use fabricexplorer;
SET NAMES utf8;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
--  Table structure for `blocks`
-- ----------------------------
DROP TABLE IF EXISTS `blocks`;
CREATE TABLE `blocks` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'id',
  `blocknum` int(11) DEFAULT NULL,
  `datahash` varchar(256) DEFAULT NULL,
  `prehash` varchar(256) DEFAULT NULL,
  `channelname` varchar(128) DEFAULT NULL,
  `txcount` int(11) DEFAULT NULL,
  `createdt` datetime DEFAULT NULL,
  `prev_blockhah` varchar(256) DEFAULT NULL,
  `blockhash` varchar(256) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=COMPACT COMMENT='blocks';

-- ----------------------------
--  Table structure for `chaincodes`
-- ----------------------------
DROP TABLE IF EXISTS `chaincodes`;
CREATE TABLE `chaincodes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `version` varchar(255) DEFAULT NULL,
  `path` varchar(255) DEFAULT NULL,
  `channelname` varchar(255) DEFAULT NULL,
  `txcount` int(11) DEFAULT '0',
  `createdt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8 ROW_FORMAT=COMPACT;

-- ----------------------------
--  Table structure for `channel`
-- ----------------------------
DROP TABLE IF EXISTS `channel`;
CREATE TABLE `channel` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'id',
  `name` varchar(64) DEFAULT NULL,
  `blocks` int(11) DEFAULT NULL,
  `trans` int(11) DEFAULT NULL,
  `createdt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8 ROW_FORMAT=COMPACT COMMENT='channel';

-- ----------------------------
--  Table structure for `peer`
-- ----------------------------
DROP TABLE IF EXISTS `peer`;
CREATE TABLE `peer` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'id',
  `org` int(11) DEFAULT NULL,
  `name` varchar(64) DEFAULT NULL,
  `mspid` varchar(64) DEFAULT NULL,
  `requests` varchar(64) DEFAULT NULL,
  `events` varchar(64) DEFAULT NULL,
  `server_hostname` varchar(64) DEFAULT NULL,
  `createdt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=COMPACT COMMENT='peer';

-- ----------------------------
--  Table structure for `peer_ref_channel`
-- ----------------------------
DROP TABLE IF EXISTS `peer_ref_channel`;
CREATE TABLE `peer_ref_channel` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'id',
  `peerid` int(11) DEFAULT NULL,
  `channelid` int(11) DEFAULT NULL,
  `createdt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=COMPACT COMMENT='';

-- ----------------------------
--  Table structure for `transaction`
-- ----------------------------
DROP TABLE IF EXISTS `transaction`;
CREATE TABLE `transaction` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'id',
  `channelname` varchar(64) DEFAULT NULL,
  `blockid` int(11) DEFAULT NULL,
  `txhash` varchar(256) DEFAULT NULL,
  `createdt` datetime DEFAULT NULL,
  `chaincodename` varchar(255) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `creator_msp_id` varchar(128) DEFAULT NULL, 
  `endorser_msp_id` varchar(800) DEFAULT NULL,
  `chaincode_id` varchar(256) DEFAULT NULL,
  `type` varchar(128) DEFAULT NULL,
  `read_set` JSON DEFAULT NULL,
  `write_set` JSON DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8 ROW_FORMAT=COMPACT COMMENT='transaction';

-- ----------------------------
--  Table structure for `write_lock`
-- ----------------------------
DROP TABLE IF EXISTS `write_lock`;
CREATE TABLE `write_lock` (
  `write_lock` int(1) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`write_lock`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

SET FOREIGN_KEY_CHECKS = 1;


DROP TABLE IF EXISTS `ints`;
CREATE TABLE ints (
  i TINYINT
);
INSERT INTO ints VALUES (0), (1), (2), (3), (4), (5), (6), (7), (8), (9);


DROP TABLE IF EXISTS `timestamp_table`;
CREATE TABLE timestamp_table (
  t TIME NOT NULL PRIMARY KEY
);

INSERT INTO timestamp_table (t)
  SELECT DISTINCT
    time('00:00:00') + INTERVAL a.i * 10000 + b.i * 1000 + c.i * 100 + d.i * 10 + e.i MINUTE
  FROM ints a
    JOIN ints b
    JOIN ints c
    JOIN ints d
    JOIN ints e
  WHERE (a.i * 10000 + b.i * 1000 + c.i * 100 + d.i * 10 + e.i) <= 1439
  ORDER BY 1;
  

 
