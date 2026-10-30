import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { CrudService } from '../../shared/services/crud.service';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {

  constructor(
    private crudService: CrudService
  ) {
  }

  getOrders(params): Observable<any> {
    // const params = {
    //   'count': '50',
    //   'start': '0'
    // };
    return this.crudService.get('/v1/private/orders', params);
  }
  getOrderDetails(orderID): Observable<any> {
    return this.crudService.get('/v1/private/orders/' + orderID);
  }
  getCountry(): Observable<any> {
    return this.crudService.get('/v1/country')
  }
  getBillingZone(value): Observable<any> {
    return this.crudService.get('/v1/zones?code=' + value)
  }
  getShippingZone(value): Observable<any> {
    return this.crudService.get('/v1/zones?code=' + value)
  }
  getHistory(orderID): Observable<any> {
    return this.crudService.get('/v1/private/orders/' + orderID + '/history')
  }
  addHistory(orderID, param): Observable<any> {
    return this.crudService.post('/v1/private/orders/' + orderID + '/history', param);
  }
  updateOrder(orderID, param): Observable<any> {
    return this.crudService.patch('/v1/private/orders/' + orderID + '/customer', param);
  }
  getNextTransaction(orderID): Observable<any> {
    return this.crudService.get('/v1/private/orders/' + orderID + '/payment/nextTransaction');
  }
  // amount is optional; without it the backend refunds the remaining captured amount
  refundOrder(orderID, amount?: number): Observable<any> {
    return this.crudService.post('/v1/private/orders/' + orderID + '/refund', amount != null ? { amount } : {});
  }
  // legal next statuses: next (all), statusUpdates (what PUT /status accepts), cancelable, paymentRecheck, refundable
  getTransitions(orderID): Observable<any> {
    return this.crudService.get('/v1/private/orders/' + orderID + '/transitions');
  }
  // fulfilment moves only; cancel and refund have their own endpoints because they move money
  updateStatus(orderID, status: string): Observable<any> {
    return this.crudService.put('/v1/private/orders/' + orderID + '/status', JSON.stringify(status));
  }
  cancelOrder(orderID, comment?: string): Observable<any> {
    return this.crudService.post('/v1/private/orders/' + orderID + '/cancel', comment ? { comment } : {});
  }
  recheckPayment(orderID): Observable<any> {
    return this.crudService.post('/v1/private/orders/' + orderID + '/payment/recheck', {});
  }
  // PAYMENT_REVIEW only: a person confirms a payment the gateway cannot report; the reason is required
  confirmPayment(orderID, reason: string, reference?: string): Observable<any> {
    return this.crudService.post('/v1/private/orders/' + orderID + '/payment/confirm', { reason, reference });
  }
  captureOrder(orderID): Observable<any> {
    return this.crudService.post('/v1/private/orders/' + orderID + '/capture', {});
  }
  getTransactions(orderID): Observable<any> {
    return this.crudService.get('/v1/private/orders/' + orderID + '/payment/transactions');
  }
}
