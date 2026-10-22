import {Body,Controller,Get,Post,Req,Res,UseGuards} from '@nestjs/common';import {Request,Response} from 'express';import {AuthService} from './auth.service';import {AuthGuard} from '../common/auth.guard';
@Controller('auth')export class AuthController{constructor(private auth:AuthService){} private set(res:Response,t:string){res.cookie('zatech_session',t,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',maxAge:2592000000,path:'/'})}
@Post('register')async register(@Body()b:any,@Res({passthrough:true})res:Response){const t=await this.auth.register(b.email,b.password,b.username,b.displayName);this.set(res,t);return{ok:true}}
@Post('login')async login(@Body()b:any,@Res({passthrough:true})res:Response){const t=await this.auth.login(b.email,b.password);this.set(res,t);return{ok:true}}
@Post('logout')async logout(@Req()req:Request,@Res({passthrough:true})res:Response){await this.auth.logout(req.cookies?.zatech_session);res.clearCookie('zatech_session');return{ok:true}}
@Get('me')@UseGuards(AuthGuard)me(@Req()req:any){const{passwordHash,...u}=req.user;return u}}
