import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { api } from './api';

type Notification = { id:string; readAt:string|null };
export function useRealtime() {
  const [notificationCount,setNotificationCount]=useState(0);
  const [connected,setConnected]=useState(false);
  useEffect(()=>{
    const token=localStorage.getItem('taskflow-token');
    if(!token)return;
    void api<Notification[]>('/notifications').then(items=>setNotificationCount(items.filter(i=>!i.readAt).length)).catch(()=>undefined);
    const base=(import.meta.env.VITE_API_URL??'http://localhost:3000/api').replace(/\/api\/?$/,'');
    const socket=io(`${base}/workspace`,{auth:{token},transports:['websocket']});
    socket.on('connect',()=>setConnected(true));socket.on('disconnect',()=>setConnected(false));
    socket.on('notification:new',()=>setNotificationCount(c=>c+1));
    socket.on('comment:created',data=>window.dispatchEvent(new CustomEvent('taskflow:comment',{detail:data})));
    socket.on('attachment:created',data=>window.dispatchEvent(new CustomEvent('taskflow:attachment',{detail:data})));
    socket.on('activity:new',data=>window.dispatchEvent(new CustomEvent('taskflow:activity',{detail:data})));
    socket.on('ai:plan-applied',data=>window.dispatchEvent(new CustomEvent('taskflow:activity',{detail:data})));
    return()=>{socket.disconnect()};
  },[]);
  return{notificationCount,connected};
}
