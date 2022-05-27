import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return '<i>Hello World!</i>';
  }

  homepage(): string {
    return ''
  }
}
