import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../services/services/auth.service';

@Component({
  selector: 'app-pagenotfound',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './pagenotfound.html',
  styleUrl: './pagenotfound.scss',
})
export class Pagenotfound {

  constructor(private router: Router, private authService: AuthService) { }

  gotoHome() {
    this.router.navigate([this.authService.getDashboardRoute()]);
  }
}
