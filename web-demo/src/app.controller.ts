import { Controller, Get, Query, Redirect, Res } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  homepage(@Query("hint") hint: string): string {
    return this.appService.homepageHtml(hint);
  }

  @Get("loadJson")
  @Redirect()
  loadJson(@Query("jsonFile") jsonFile: string) {
    return { url: ("http://127.0.0.1:" + (process.env.PORT || 3000).toString() + "/?hint=" + this.appService.loadJson(jsonFile)) };
  }

  @Get("mineBlock")
  @Redirect("http://127.0.0.1:" + (process.env.PORT || 3000).toString() + "/?hint=Mining Finished.")
  mineBlock(
    @Query("hkid") hkid: string, 
    @Query("patient") patient: string, 
    @Query("doctor") doctor: string, 
    @Query("date") date: string,
    @Query("data") userdata: string) {
    return this.appService.mineBlock(hkid, patient, doctor, date, userdata);
  }
}