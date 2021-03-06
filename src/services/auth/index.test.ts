import {
  provide,
  Injectable,
  ReflectiveInjector,
} from '@angular/core';
import { MockBackend } from '@angular/http/testing';
import {
  fakeAsync,
  inject,
  it,
  describe,
  tick
} from '@angular/core/testing';
import {
  BaseRequestOptions,
  ConnectionBackend,
  Headers,
  Http,
  Response,
  ResponseType
} from '@angular/http';

import { NgRedux } from 'ng2-redux';

import { ServerService } from '../server';
import { AuthService } from './index';

@Injectable()
class MockRedux extends NgRedux<any> {
  private state = {};

  constructor() {
    super(null);
  }

  dispatch = () => undefined;
  getState = () => ({});
};

describe('authenticator-service', () => {
  it('should accept a valid email address',
    fakeAsync(inject([], () => {
      const injector = ReflectiveInjector.resolveAndCreate([
        NgRedux,
        AuthService,
        ServerService,
        MockBackend,
        BaseRequestOptions,
        provide(Http, {
          useFactory: (backend, options) => {
            return new Http(backend, options);
          },
          deps: [MockBackend, BaseRequestOptions]
        }),
        provide(NgRedux, { useFactory: () => new MockRedux() }),
      ]);

      const http = injector.get(Http);

      const backend = injector.get(MockBackend);

      let connection;
      backend.connections.subscribe(c => connection = c);

      const service = injector.get(AuthService);

      const username = 'foo@bar.com';
      const password = 'password';

      const p = service.login(username, password);

      const response = {
        token: new Date().valueOf().toString(16),
      };

      if (connection == null) {
        throw new Error('Authenticator did not make an HTTP request');
      }

      connection.mockRespond(new Response({
        body: JSON.stringify(response),
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        type: ResponseType.Basic,
        url: '/auth/login',
        merge: null
      }));

      tick();

      return p.then(r => expect(r.token).toEqual(response.token));
    })));
});
