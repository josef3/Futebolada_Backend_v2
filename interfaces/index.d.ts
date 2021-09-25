import { Request, Response, NextFunction } from 'express';

export interface IRequest extends Request {
    admin_role?: 'admin' | 'read-only';
    id_admin?: number;
    id_player?: number;
};

export interface IResponse extends Response { };

export interface INext extends NextFunction { };