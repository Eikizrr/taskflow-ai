import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      status: 'ok',
      service: 'taskflow-api',
      timestamp: new Date().toISOString(),
    };
  }
}
