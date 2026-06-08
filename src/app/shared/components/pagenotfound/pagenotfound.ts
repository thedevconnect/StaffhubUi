import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-pagenotfound',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './pagenotfound.html',
  styleUrl: './pagenotfound.scss',
})
export class Pagenotfound {

  constructor(private router: Router) { }

  gotoHome() {
    this.router.navigate(['/home']);
  }


}
