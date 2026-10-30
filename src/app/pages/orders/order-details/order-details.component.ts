import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { NbDialogService } from '@nebular/theme';
import { OrdersService } from '../services/orders.service';
import * as moment from 'moment';
import { OrderInvoiceComponent } from '../order-invoice/order-invoice';
import { OrderHistoryComponent } from '../order-history/order-history';
import { OrderTransactionComponent } from '../order-transaction/order-transaction';

import { Router } from '@angular/router';
import { parsePhoneNumberFromString, format, AsYouType } from 'libphonenumber-js';

@Component({
  selector: 'ngx-order-details',
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss']
})
export class OrderDetailsComponent implements OnInit {
  shippingCountry: Array<any> = []
  shippingStateData: Array<any> = []
  billingStateData: Array<any> = []
  billingCountry: Array<any> = []
  groups: Array<any> = []
  selectedGroups: Array<any> = []
  loadingList = false;
  orderDetailsData: any;
  historyListData: Array<any> = [];
  transactionListData: Array<any> = [];
  // filled from GET /transitions: only the moves PUT /status accepts from the current status
  statusList: Array<any> = []
  // what the backend allows next for this order (cancel, payment re-check, refundable amount)
  lifecycle: any = null
  public scrollbarOptions = { axis: 'y', theme: 'minimal-dark' };
  info = {
    userName: '',
    language: '',
    emailAddress: '',
    datePurchased: ''
  }
  statusFields = {
    comments: '',
    status: ''
  }
  shipping = {
    phone: '',
    firstName: '',
    lastName: '',
    company: '',
    address: '',
    city: '',
    zone: '',
    tempZone: '',
    country: '',
    tempCountry: '',
    postalCode: '',

  }
  billing = {
    firstName: '',
    lastName: '',
    company: '',
    address: '',
    city: '',
    zone: '',
    tempZone: '',
    country: '',
    tempCountry: '',
    postalCode: '',
    phone: ''
  }
  transactionType: string = ''
  orderID: any;
  defaultCountry: any;
  buttonText: any = 'Update Order'
  languages: Array<any> = [{ 'code': 'en', 'name': 'English' }, { 'code': 'fr', 'name': 'French' }]
  constructor(private ordersService: OrdersService, private toastr: ToastrService,
    private dialogService: NbDialogService, private router: Router) {
    // console.log(this.router.getCurrentNavigation());
    this.getCountry();


  }
  getOrderDetails() {
    this.loadingList = true;
    this.ordersService.getOrderDetails(this.orderID)
      .subscribe(data => {
        this.loadingList = false;
        // console.log(data);
        this.orderDetailsData = data;
        this.onBillingChange(data.billing.country, 0)


        this.info.emailAddress = data.customer.emailAddress;
        this.info.datePurchased = data.datePurchased;

        this.billing = data.billing;
        if (data.delivery) {
          this.onShippingChange(data.delivery.country, 0)

          this.shipping = data.delivery;
        }

      }, error => {
        this.loadingList = false;
      });
  }
  ngOnInit() {
    if (localStorage.getItem('orderID')) {
      this.orderID = localStorage.getItem('orderID')
      this.getOrderDetails();
    }
    this.getHistory();
    this.getNextTransaction();
    this.getTransitions();
  }
  // reloads everything that depends on the order status after a command
  refreshOrder() {
    this.getOrderDetails();
    this.getHistory();
    this.getNextTransaction();
    this.getTransitions();
  }
  getTransitions() {
    this.ordersService.getTransitions(this.orderID)
      .subscribe(data => {
        this.lifecycle = data;
        this.statusList = (data.statusUpdates || []).map(s => ({ name: s, id: s }));
      }, error => {
        this.lifecycle = null;
        this.statusList = [];
      });
  }
  errorMessage(error, fallback: string): string {
    return (error && error.error && error.error.message) || fallback;
  }
  getNextTransaction() {
    this.ordersService.getNextTransaction(this.orderID)
      .subscribe(data => {
        // console.log(data);
        this.transactionType = data.transactionType;
      }, error => {

      });
  }
  getHistory() {
    this.ordersService.getHistory(this.orderID)
      .subscribe(data => {
        // console.log(data);
        this.historyListData = data;
      }, error => {

      });
    this.geTransactions()
  }
  geTransactions() {
    this.ordersService.getTransactions(this.orderID)
      .subscribe(data => {
        // console.log(data);
        this.transactionListData = data;
      }, error => {

      });
  }
  getCountry() {
    this.ordersService.getCountry()
      .subscribe(data => {

        this.shippingCountry = data;
        this.billingCountry = data;
      }, error => {

      });
  }
  onBillingChange(value, flag) {
    this.ordersService.getBillingZone(value)
      .subscribe(data => {
        if (data.length > 0) {

          this.billingStateData = data;
          if (flag == 1) {
            this.billing.zone = data[0].code;

          }
        } else {
          this.billingStateData = data;
          this.billing.zone = '';

        }
      }, error => {

      });
  }
  onChangeStateBilling(value) {

  }
  onShippingChange(value, flag) {

    this.ordersService.getShippingZone(value)
      .subscribe(data => {
        if (data.length > 0) {


          this.shippingStateData = data;
          if (flag == 1) {
            this.shipping.zone = data[0].code

          }
        } else {
          this.shippingStateData = data;
          this.shipping.zone = '';

        }
      }, error => {

      });
  }
  onChangeStateShipping(value) {

  }
  // changes Order.status through PUT /status, then keeps the comment as a history note
  updateHistory() {
    this.loadingList = true;
    const status = this.statusFields.status;
    const comments = this.statusFields.comments;
    this.ordersService.updateStatus(this.orderID, status)
      .subscribe(() => {
        if (!comments) {
          this.statusUpdated();
          return;
        }
        const note = { comments, date: moment().format('YYYY-MM-DD'), status };
        this.ordersService.addHistory(this.orderID, note)
          .subscribe(() => this.statusUpdated(), error => {
            this.loadingList = false;
            this.toastr.error(this.errorMessage(error, 'Status updated, but the comment was not saved'));
            this.refreshOrder();
          });
      }, error => {
        this.loadingList = false;
        this.toastr.error(this.errorMessage(error, 'Status update failed'));
      });
  }
  statusUpdated() {
    this.loadingList = false;
    this.toastr.success('Order status has been updated');
    this.statusFields = { comments: '', status: '' };
    this.refreshOrder();
  }
  onClickCancelOrder() {
    if (!window.confirm('Cancel order ' + this.orderID + '? Any captured payment is refunded and the stock is returned.')) {
      return;
    }
    this.loadingList = true;
    this.ordersService.cancelOrder(this.orderID, this.statusFields.comments)
      .subscribe(data => {
        this.loadingList = false;
        this.toastr.success(data.message || 'Order has been canceled');
        this.statusFields = { comments: '', status: '' };
        this.refreshOrder();
      }, error => {
        this.loadingList = false;
        this.toastr.error(this.errorMessage(error, 'Cancel failed'));
      });
  }
  onClickRecheckPayment() {
    this.loadingList = true;
    this.ordersService.recheckPayment(this.orderID)
      .subscribe(data => {
        this.loadingList = false;
        this.toastr.success(data.message || 'Payment re-checked');
        this.refreshOrder();
      }, error => {
        this.loadingList = false;
        this.toastr.error(this.errorMessage(error, 'Payment re-check failed'));
      });
  }
  updateOrder() {
    this.loadingList = true;
    let param = {
      "emailAddress": this.info.emailAddress,
      "billing": {
        "postalCode": this.billing.postalCode,
        "firstName": this.billing.firstName,
        "lastName": this.billing.lastName,
        "company": "",
        "phone": this.billing.phone,
        "address": this.billing.address,
        "city": this.billing.city,
        "billingAddress": false,
        "zone": this.billing.zone,
        "country": this.billing.country
      },
      "delivery": {
        "postalCode": this.shipping.postalCode,
        "firstName": this.shipping.firstName,
        "lastName": this.shipping.lastName,
        "company": "",
        "phone": this.shipping.phone,
        "address": this.shipping.address,
        "city": this.shipping.city,
        "billingAddress": false,
        "zone": this.shipping.zone,
        "country": this.shipping.country
      }
    }
    this.ordersService.updateOrder(this.orderID, param)
      .subscribe(data => {
        this.loadingList = false;
        this.toastr.success("Order has been updated successfully");
        // this.shippingStateData = data;
      }, error => {
        this.loadingList = false;
        this.toastr.error(this.errorMessage(error, "Order update failed"));
      });
  }
  onPhoneChange() {
    this.billing.phone = new AsYouType('US').input(this.billing.phone);
  }
  onShippingPhoneChange() {
    this.shipping.phone = new AsYouType('US').input(this.shipping.phone);
  }
  goToback() {
    this.router.navigate(['pages/orders/order-list']);
  }
  // asks for the amount, defaulting to what is still refundable; a full refund also returns the stock
  onClickRefund() {
    const remaining = this.lifecycle && this.lifecycle.refundable != null ? Number(this.lifecycle.refundable) : null;
    const currency = (this.lifecycle && this.lifecycle.currency) || (this.orderDetailsData && this.orderDetailsData.currency) || '';
    const answer = window.prompt('Refund amount (' + currency + ')' + (remaining != null ? ', at most ' + remaining.toFixed(2) : ''),
      remaining != null ? remaining.toFixed(2) : '');
    if (answer === null) {
      return;
    }
    const amount = Number(String(answer).trim());
    if (!(amount > 0) || (remaining != null && amount > remaining)) {
      this.toastr.error('Enter an amount greater than 0' + (remaining != null ? ' and at most ' + remaining.toFixed(2) : ''));
      return;
    }
    this.loadingList = true;
    this.ordersService.refundOrder(this.orderID, amount)
      .subscribe(data => {
        this.loadingList = false;
        this.toastr.success("Order has been refunded successfully");
        this.refreshOrder();
      }, error => {
        this.loadingList = false;
        this.toastr.error(this.errorMessage(error, "Refund failed"));
      });
  }
  onClickCapture() {
    this.loadingList = true;
    this.ordersService.captureOrder(this.orderID)
      .subscribe(data => {
        console.log()
        this.loadingList = false;
        this.toastr.success("Order has been captured successfully");
        this.refreshOrder();
      }, error => {
        this.loadingList = false;
        this.toastr.error((error && error.error && error.error.message) || "Capture failed");
      });
  }
  showDialog(value) {
    // console.log(value)
    if (value == 1) {
      this.dialogService.open(OrderTransactionComponent, {
        context: {
          transactionData: this.transactionListData,
        },
      });
    } else if (value == 2) {
      this.dialogService.open(OrderInvoiceComponent, {
        context: {
          orderData: this.orderDetailsData,
        },
      });
    } else if (value == 3) {
      this.dialogService.open(OrderHistoryComponent, {
        context: {
          historyData: this.historyListData
        },
      });
    }
  }
}
