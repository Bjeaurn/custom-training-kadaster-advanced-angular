import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalService } from 'src/app/core/services/modal-service/modal.service';
import { VALIDATIONS } from 'src/app/modules/beheer/gebruiker-toevoegen/validations.constant';
import { MESSAGES } from '@constants/messages.constant';
import { ToastrService } from 'ngx-toastr';
import { ProjectDetails } from 'src/app/core/models/project-details.interface';

@Component({
  selector: 'app-projectgegevens-aanpassen',
  templateUrl: './projectgegevens-aanpassen.component.html',
  standalone: false,
})
export class ProjectgegevensAanpassenComponent {
  @Output() projectUpdateEvent = new EventEmitter<ProjectDetails>();
  @Input() projectGegevensModalName!: string;
  @Input() projectDetails!: ProjectDetails;
  @Input() allowEdit = false;

  projectGegevensForm: FormGroup;
  projectType: string | undefined;
  projectNumber: string | undefined;
  formValue?: { projectNaam: string; omschrijving: string };
  mandatoryProjectNaam = MESSAGES.FORM_VALIDATION.MANDATORY_PROJECTNAME;
  invalidMax300CharsMessage = MESSAGES.FORM_VALIDATION.INVALID_MAX_300_CHARS;
  invalidMax1000CharsMessage =
    MESSAGES.FORM_VALIDATION.INVALID_NUMBER_OF_CHARS_1000;

  constructor(
    private readonly modalService: ModalService,
    private readonly formBuilder: FormBuilder,
    private readonly toastr: ToastrService
  ) {
    this.projectGegevensForm = this.formBuilder.group({
      projectNaam: [
        '',
        [
          Validators.required,
          Validators.maxLength(VALIDATIONS.MAX_LENGTH_PROJECT_NAAM),
        ],
      ],
      omschrijving: [
        '',
        [Validators.maxLength(VALIDATIONS.MAX_LENGTH_PROJECT_OMSCHRIJVING)],
      ],
    });
  }

  /**
   * dit is een custom init functie vergelijkbaar met de ngOnInit.
   *
   * Wordt getriggered wanneer de modal opent.
   */
  initModal() {
    this.projectGegevensForm.reset();

    this.projectType = this.projectDetails.projectType.waarde;
    this.projectNumber =
      this.projectDetails.projectType.code + this.projectDetails.projectNummer;

    this.projectGegevensForm.patchValue({
      projectNaam: this.projectDetails.projectNaam,
      omschrijving: this.projectDetails.projectOmschrijving,
    });
  }

  onSubmit() {
    this.formValue = this.projectGegevensForm.value;

    const omschrijving =
      this.formValue?.omschrijving === '' ||
      this.formValue?.omschrijving === ' '
        ? undefined
        : this.formValue?.omschrijving;

    if (this.projectGegevensForm.valid) {
      const requestBody: ProjectDetails = {
        projectNummer: this.projectDetails.projectNummer,
        projectNaam: this.formValue!.projectNaam,
        projectOmschrijving: omschrijving,
        projectSleutel: this.projectDetails.projectSleutel,
        projectType: {
          waarde: this.projectDetails.projectType.waarde,
          code: this.projectDetails.projectType.code,
        },
      };
      this.projectUpdateEvent.emit(requestBody);
    } else {
      this.projectGegevensForm.markAllAsTouched();
      this.toastr.error(MESSAGES.FORM_VALIDATION.INVALID_FORM);
    }
  }
}
