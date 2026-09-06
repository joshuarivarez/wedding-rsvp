import { Component, AfterViewInit, OnDestroy, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { WeddingLogo } from './wedding-logo';
import { AutumnLeaves } from './autumn-leaves';
import { ElegantAmpersand } from './elegant-ampersand';
import { RsvpComponent } from './rsvp/rsvp.component';
import { GalleryComponent } from './gallery/gallery.component';
import { MockRsvpGateway, RSVP_GATEWAY } from './rsvp/rsvp.gateway';

@Component({selector:'app-root',standalone:true,imports:[WeddingLogo, AutumnLeaves, ElegantAmpersand, GalleryComponent, RsvpComponent],templateUrl:'./app.html',styleUrl:'./sticky-header.css',styles: [':host { display: block; isolation: isolate; }']})
class App implements AfterViewInit, OnDestroy {
  menu = signal(false);
  observer?: IntersectionObserver;
  closeMenu() { this.menu.set(false); }
  ngAfterViewInit() {
    this.observer = new IntersectionObserver(entries => entries.forEach(entry => { if(entry.isIntersecting) { entry.target.classList.add('visible'); this.observer?.unobserve(entry.target); } }), {threshold:0.08});
    document.querySelectorAll('.reveal').forEach(el => this.observer?.observe(el));
  }
  ngOnDestroy() { this.observer?.disconnect(); }
  calendar() {
    // 4:00 PM in the Philippines is 08:00 UTC. No end time has been specified.
    const contents = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Joshua and Judy Ann//Wedding//EN',
      'BEGIN:VEVENT', 'UID:joshua-judy-ann-20270208@wedding.local',
      'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z'),
      'DTSTART:20270208T080000Z', 'SUMMARY:Joshua & Judy Ann Wedding',
      'LOCATION:10 22 Lipa\\, Alaminos Rd.\\, Lipa City\\, Batangas',
      'DESCRIPTION:Celebrate the wedding of Joshua & Judy Ann.',
      'END:VEVENT', 'END:VCALENDAR', ''
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([contents],{type:'text/calendar'})); const link = document.createElement('a'); link.href=url; link.download='joshua-and-judy-ann.ics'; link.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
}
bootstrapApplication(App, {
  providers: [{ provide: RSVP_GATEWAY, useClass: MockRsvpGateway }],
}).catch(console.error);
