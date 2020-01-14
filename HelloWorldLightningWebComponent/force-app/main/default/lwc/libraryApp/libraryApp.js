/* eslint-disable no-console */
import { LightningElement, wire, track } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
// import { refreshApex } from '@salesforce/apex';
import Id from '@salesforce/user/Id';
import NAME_FIELD from '@salesforce/schema/User.Name';
import getContactID from '@salesforce/apex/libraryNumberToContact.getContactID';
import getContactName from '@salesforce/apex/libraryNumberToContact.getContactName';
import createLoan from '@salesforce/apex/libraryAppCreateLoan.createLoan';
import getNameDue from '@salesforce/apex/libraryAppCreateLoan.getNameDue'
import returnLoan from '@salesforce/apex/libraryAppCreateLoan.returnLoan'

const fields = [NAME_FIELD];
const initialUserMessage = "No User Entered"
const initialBookMessage = "No Materials Yet Scanned"
let bookmessageBool = true
let usermessageBool = false


export default class libraryApp extends LightningElement {
    userId = Id;
    @track userEnteredID = '';
    @track bookID = '';
    @track foundUserName = '';
    @track foundUserID = '';
    @track selectedID = undefined;
    @track loanError;
    @track loanID;
    @track enteredID;
    @track bookMessage;
    @track bookmessageBool;
    @track newReceiptLine = '';
    @track bookReturnID = '';
    @track loanReturnError;
    @track enteredReturnID
    loansOut = '';
    
    @wire(getContactID, {libID: '$selectedID'}) 
    foundUserID;
    @wire(getContactName, {libID: '$selectedID'}) 
    foundUserName;
    @wire(getRecord, { recordId: '$userId', fields })
    user;
    @wire(getNameDue, {newLoanID: '$loanID'})
    newReceiptLine ='';
    oldRecieptLine ='';

    //TODO: write apex to grab book record by number. and activate button
    get name() {
        return getFieldValue(this.user.data, NAME_FIELD)
    }

    get receipt() {
        console.log("newLine " + this.newReceiptLine.data);
        if (this.newReceiptLine.data !== this.oldRecieptLine && this.newReceiptLine.data) {
            this.oldRecieptLine = this.newReceiptLine.data
            this.loansOut = this.loansOut + this.newReceiptLine.data + '\n'
        } 
        console.log('loansout: ' + this.loansOut);
        return this.loansOut;
    }

    handleIDChange(evt) {
        this.userEnteredID = evt.target.value;
        console.log("handle ID change: " + evt.target.value);
    }

    get displayUserName() {
        console.log('get displayUserName(): ' + this.foundUserName.data);
        if (this.foundUserName.data === '' || this.foundUserName.data === undefined) {
            if(this.selectedID === undefined) {
                this.userMessage = initialUserMessage;
            } else {
                this.userMessage = 'Try Again';
            }
            usermessageBool = false;
            return '';
        }
        usermessageBool = true;
        this.userMessage = 'Contact Entered'
        return this.foundUserName.data;
    }

    handleIDClick() {
        console.log('Current value of the input: ' + this.userEnteredID);
        this.selectedID = this.userEnteredID;
        console.log('selectedID: ' + this.selectedID );
        console.log('foundName: ' + this.foundUserName.data);
        console.log('found contact record id: ' + this.foundUserID.data)
    }   

    handleBookChange(evt) {
        this.bookID = evt.target.value;
        console.log("handle book change: " + evt.target.value);
    }

    handleBookClick() {
        console.log('Current value of book:', this.bookID);
        this.enteredID = this.bookID;
        if(usermessageBool){
            createLoan({userID: this.selectedID, copyNumber: this.bookID})
             .then(result => {
                this.loanID = result;
                this.bookMessage = 'Material Signed out: ' + this.enteredID;
                bookmessageBool = true;
                console.log('loanID: ' + this.loanID);
                this.bookID ='';
            })
            .catch(error =>{
                console.log(JSON.stringify(error));
               this.loanError = error.body.message;
               this.bookMessage = this.loanError;
               bookmessageBool = false;
               console.log('book click error: ' + this.loanError);
               this.bookID ='';
            })
        }else {
            bookmessageBool = false;
            this.bookMessage = 'Ensure Valid User Is Entered'
        }
    }

    keycheck(component){
        if (component.which == 13){
            console.log('Enter Pressed');
           this.handleBookClick();
        }
    }

    handleBookReturnChange(evt) {
        this.bookReturnID = evt.target.value;
        console.log("handle retrun book change: " + evt.target.value);
    }

    handleBookReturnClick() {
        console.log('Current value of book Return:', this.bookReturnID);
        this.enteredReturnID = this.bookReturnID;
       
        returnLoan({oldLoanID: this.bookReturnID})
         .then(result => {
            this.bookMessage = 'Book Returned: ' + this.enteredReturnID;
            bookmessageBool = true;
            this.bookReturnID ='';
        })
        .catch(error =>{
            console.log(JSON.stringify(error));
            this.loanReturnError = error.body.message;
            this.bookMessage = this.loanReturnError;
            bookmessageBool = false;
            console.log('book click error: ' + this.loanReturnError);
            this.bookReturnID ='';
        })
    }
    
    keycheckReturn(component){
        if (component.which == 13){
            console.log('Enter Pressed');
           this.handleBookClick();
        }
    }

    handleClearClick(){
        eval("$A.get('e.force:refreshView').fire();");
    }

    get bookMessageClass() { 
        return (bookmessageBool) ? 'slds-box slds-theme_success' : 'slds-box slds-theme_error';
      }
    get userMessageClass() {
        return (usermessageBool) ? 'slds-box slds-theme_success' : 'slds-box slds-theme_error'
    }
    bookMessage = initialBookMessage;
    userMessage = initialUserMessage;
}