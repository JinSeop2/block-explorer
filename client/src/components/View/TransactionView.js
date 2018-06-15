/**
 *    SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import PropTypes from 'prop-types';
import FontAwesome from 'react-fontawesome';
import Typography from 'material-ui/Typography';
import {
    DialogContent,
    DialogContentText,
    DialogTitle,
} from 'material-ui/Dialog';
import moment from 'moment-timezone';

const styles = theme => ({
    root: {
        flexGrow: 1,
        paddingTop: 42,
        position: 'relative',
    },
    card: {
        height: 250,
        width: 1215,
        margin: 20,
        textAlign: 'left',
        display: 'inline-block',
    },
    title: {
        fontSize: 16,
        color: theme.palette.text.secondary,
        position: 'absolute',
        left: 40,
        top: 60
    },
    content: {
        fontSize: 12,
        color: theme.palette.text.secondary,
        position: 'absolute',
        left: 40,
        top: 70
    }
});

class TransactionView extends Component {
    constructor(props, context) {
        super(props, context);
        this.state = {
            loading: false
        }
    }
    componentWillReceiveProps(nextProps) {
        this.setState({ loading: false });
    }
    render() {
        const { classes } = this.props; 
     ///   var  a = this.props.transaction.read_set; 
      //  var  aa = JSON.stringify(a); 
      //  console.log("aaaaaaaaaaaaaaaaaaaaaa", aa);
       // console.log("aaaaaaaaaaaaaaaaaa :  ", a);

        if (this.props.transaction.read_set === undefined) {
            return (
                <div>
                    <DialogTitle>Transaction Detail</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            <p className="loading-wheel"> <FontAwesome name="circle-o-notch" size="3x" spin /></p>
                        </DialogContentText>
                    </DialogContent>
                </div>
            );
        }
        else {
            return (
                <div>
                    <DialogTitle>Transaction Detail</DialogTitle>
                    <DialogContent>
                        <DialogContentText>

                            <b>Tx:</b>{this.props.transaction.txhash} <br />
                            <b>Creator MSP:</b> {this.props.transaction.creator_msp_id} <br />
                            <b>Endorser:</b> {this.props.transaction.endorser_msp_id} <br />
                            <b>Chaincode Name:</b> {this.props.transaction.chaincodename} <br />
                            <b>Type:</b> {this.props.transaction.type} <br />
                            <b>Time:</b> {moment(this.props.transaction.createdt).tz(moment.tz.guess()).format("M-D-YYYY h:mm A zz")} <br />
                           
                   
                <b>ReadSet: </b>  {this.props.transaction.read_set}<br/> 
                            <b>WriteSet: </b> {this.props.transaction.write_set} <br/>          
                </DialogContentText>
                    </DialogContent>
                </div>

            );
        }
    }
}


TransactionView.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(TransactionView);
