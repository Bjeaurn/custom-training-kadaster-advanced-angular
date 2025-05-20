import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProjectRegels } from 'src/app/core/models/project-regels.interface';
import { DateTime } from 'luxon';
import { MESSAGES } from '@constants/messages.constant';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-projectregels-aanpassen',
  templateUrl: './projectregels-aanpassen.component.html',
  standalone: false,
})
export class ProjectregelsAanpassenComponent {
  @Input() projectRegels!: ProjectRegels;
  @Output() projectRegelsUpdateEvent = new EventEmitter<ProjectRegels>();
  @Input() allowEdit = false;
  projectRegelsForm: FormGroup;
  projectSleutel: string;
  formValue?: { kortingspercentage: number; peildatum: string };
  placeholderPeilDatum = 'dd-mm-jjjj';
  placeholderKortingsPercentage = '0 - 100';
  invalidKortingspercentage =
    MESSAGES.FORM_VALIDATION.INVALID_KORTINGPERCENTAGE;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly formBuilder: FormBuilder,
    private readonly toastr: ToastrService
  ) {
    this.projectSleutel = this.route.snapshot.params['projectSleutel'];
    this.projectRegelsForm = this.formBuilder.group({
      kortingspercentage: [
        '',
        [
          Validators.min(0),
          Validators.max(99.99),
          Validators.pattern(/^\d{1,2}(,\d{1,2})?$/),
        ],
      ],
      peildatum: ['', []],
    });
  }

  /**
   * Deze modal gaat met nog meer functionaliteit en keys gevuld worden in vervolg stories.
   */
  initModal() {
    this.projectRegelsForm.reset();
    const rawDate = this.projectRegels?.peilDatum;
    const formattedDate = rawDate ? this.convertToFrontendFormat(rawDate) : '';
    this.projectRegelsForm.patchValue({
      kortingspercentage:
        this.projectRegels.kortingsPercentage &&
        this.projectRegels.kortingsPercentage !== 0
          ? this.projectRegels.kortingsPercentage.toString().replace('.', ',')
          : null,
      peildatum: formattedDate || '',
    });
  }

  convertToFrontendFormat(dateString: string): string {
    const date = DateTime.fromFormat(dateString, 'dd-MM-yyyy');
    return date.isValid ? date.toISODate() : '';
  }

  convertToBackendFormat(dateString: string): string {
    if (!dateString) return '';
    return DateTime.fromISO(dateString).toFormat('dd-MM-yyyy');
  }

  onSubmit() {
    this.formValue = this.projectRegelsForm.value;
    if (this.projectRegelsForm.valid) {
      const formattedDate = this.convertToBackendFormat(
        this.formValue!.peildatum
      );
      const requestBody: ProjectRegels = {
        projectSleutel: this.projectSleutel,
        kortingsPercentage: Number(
          this.formValue!.kortingspercentage?.toString().replace(',', '.')
        ),
        peilDatum: formattedDate,
      };
      this.projectRegelsUpdateEvent.emit(requestBody);
    } else {
      this.projectRegelsForm.markAllAsTouched();
      this.toastr.error(MESSAGES.FORM_VALIDATION.INVALID_FORM);
    }
  }
}
