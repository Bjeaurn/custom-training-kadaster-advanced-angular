import { DialogRef } from '@angular/cdk/dialog';
import {
  AfterViewInit,
  Component,
  inject,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Gebruiker } from '@core/models/gebruiker.interface';
import { ModalAnswer, ModalResult } from '@core/models/modal.model';
import { ProjectGebruiker } from '@core/models/project-gebruiker.interface';
import {
  ProjectGebruikerDetails,
  ProjectMedewerkers,
} from '@core/models/project-medewerkers.interface';
import { UserStore } from '@core/state/user.store';
import { ProjectenService } from '@services/projecten/projecten.service';
import { VALIDATIONTYPE } from '@shared/enums/validation-type.enum';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserJWT } from 'src/app/core/models/user-jwt.interface';
import { ModalService } from 'src/app/core/services/modal-service/modal.service';
import { MESSAGES } from 'src/app/shared/constants/messages.constant';
import { ROLES } from 'src/app/shared/constants/roles.constant';

@Component({
  selector: 'app-medewerkers-aanpassen',
  templateUrl: './medewerkers-aanpassen.component.html',
  styleUrls: ['./medewerkers-aanpassen.component.scss'],
  standalone: false,
})
export class MedewerkersAanpassenComponent implements AfterViewInit {
  @ViewChild('confirmDeleteTemplate', { static: false })
  confirmDeleteTemplate!: TemplateRef<Element>;

  medewerkersToevoegenForm: FormGroup;
  private readonly subscriptions: Subscription[] = [];
  private readonly projectTypeCode: string;
  private readonly projectNumber: number;
  protected gebruikers!: Observable<Gebruiker[] | null>;
  protected assignedProjectGebruikersList!: ProjectGebruiker[];

  filteredGebruikers: Gebruiker[] = [];
  unassignedGebruikersList: Gebruiker[] = [];
  assignedGebruikersList: Gebruiker[] = [];
  zoekTerm = '';
  searchFieldClicked = false;
  messages = MESSAGES;
  medewerkerToDelete: Gebruiker | null = null;

  gebruiker: UserJWT | undefined = undefined;

  userStore = inject(UserStore);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly projectService: ProjectenService,
    private readonly modalService: ModalService,
    private readonly formBuilder: FormBuilder,
    private readonly toastr: ToastrService,
    private readonly dialogRef: DialogRef
  ) {
    const projectSleutel = this.route.snapshot.params['projectSleutel'];
    this.projectNumber = +projectSleutel.substring(projectSleutel.length - 4);
    this.projectTypeCode = projectSleutel.substring(
      0,
      projectSleutel.length - 4
    );

    this.medewerkersToevoegenForm = this.formBuilder.group({
      addedMedewerkers: this.formBuilder.array([], Validators.required),
    });
  }

  get addedMedewerkersFormArray(): FormArray {
    return this.medewerkersToevoegenForm.controls[
      'addedMedewerkers'
    ] as FormArray;
  }

  ngAfterViewInit() {
    this.gebruiker = this.userStore.loggedInUser();
  }

  loadAllGebruikers() {
    this.loadAndSubscribeUnassignedGebruikers();
    this.loadAndSubscribeAssignedMedewerkers();
  }

  loadAndSubscribeUnassignedGebruikers() {
    this.subscriptions.push(
      this.loadUnassignedGebruikers(
        this.projectNumber,
        this.projectTypeCode
      ).subscribe(medewerkers => {
        this.filteredGebruikers = this.unassignedGebruikersList =
          medewerkers || [];
      })
    );
  }

  loadAndSubscribeAssignedMedewerkers() {
    if (this.assignedGebruikersList.length > 0) {
      return;
    }
    this.subscriptions.push(
      this.loadAssignedMedewerkers(
        this.projectNumber,
        this.projectTypeCode
      ).subscribe(assignedMedewerkers => {
        this.assignedProjectGebruikersList = assignedMedewerkers;
        this.initializeAssignedMedewerkers();
      })
    );
  }

  expandZoekveld() {
    this.searchFieldClicked = true;
  }

  onChangeZoekveld(term: string): void {
    this.zoekTerm = term;
    this.filteredGebruikers = this.unassignedGebruikersList
      .filter(medewerker =>
        medewerker.gebruikersNaam.toLowerCase().includes(term.toLowerCase())
      )
      .filter(
        medewerker =>
          this.assignedGebruikersList
            .map(mdw => mdw.verkorteGebruikersNaam)
            .indexOf(medewerker.verkorteGebruikersNaam) === -1
      );
  }

  addMedewerkersToList(medewerker: Gebruiker) {
    this.assignedGebruikersList.push(medewerker);
    this.onChangeZoekveld('');

    this.medewerkersToevoegenForm.patchValue({
      verkorteGebruikersNaam: medewerker.verkorteGebruikersNaam,
    });

    const medewerkersForm = this.formBuilder.group({
      verkorteGebruikersNaam: [
        medewerker.verkorteGebruikersNaam,
        Validators.required,
      ],
      projectGebruikerRolWaarde: [null, Validators.required],
    });

    this.addedMedewerkersFormArray.push(medewerkersForm);
  }

  selectChange($event: any, index: number) {
    const selectedRole = $event.target.value;

    this.addedMedewerkersFormArray.at(index).patchValue({
      projectGebruikerRolWaarde: selectedRole,
    });
  }

  loadUnassignedGebruikers(
    projectNummer: number,
    projectTypeCode: string,
    projectSleutel = projectTypeCode + projectNummer
  ): Observable<Gebruiker[] | null> {
    return this.projectService
      .getUnassignedGebruikers(projectSleutel)
      .pipe(map(result => result));
  }

  loadAssignedMedewerkers(
    projectNummer: number,
    projectTypeCode: string,
    projectSleutel = projectTypeCode + projectNummer
  ): Observable<ProjectGebruiker[]> {
    return this.projectService
      .getAssignedMedewerkers(projectSleutel)
      .pipe(map(result => result));
  }

  initializeAssignedMedewerkers() {
    this.assignedGebruikersList = this.mapAssignedMedewerkers(
      this.assignedProjectGebruikersList
    );

    this.assignedProjectGebruikersList.forEach(medewerker => {
      const medewerkersForm = this.formBuilder.group({
        verkorteGebruikersNaam: [
          medewerker.gebruikerDto.verkorteGebruikersNaam,
          Validators.required,
        ],
        projectGebruikerRolWaarde: [
          {
            value: medewerker.projectGebruikerRolWaarde,
            disabled: this.medewerkerIsCurrentGebruiker(
              medewerker.gebruikerDto.verkorteGebruikersNaam
            ),
          },
          Validators.required,
        ],
      });
      this.addedMedewerkersFormArray.push(medewerkersForm);
    });
  }

  private mapAssignedMedewerkers(assignedMedewerkers: ProjectGebruiker[]) {
    return assignedMedewerkers.map(projectGebruiker => ({
      verkorteGebruikersNaam:
        projectGebruiker.gebruikerDto.verkorteGebruikersNaam,
      gebruikersNaam: projectGebruiker.gebruikerDto.gebruikersNaam,
      email: projectGebruiker.gebruikerDto.email,
      rollen: projectGebruiker.gebruikerDto.rollen,
    }));
  }

  onSubmit() {
    this.medewerkersToevoegenForm.markAllAsTouched();
    if (this.medewerkersToevoegenForm.valid) {
      const projectMedewerkersArray: ProjectGebruikerDetails[] =
        this.addedMedewerkersFormArray.getRawValue().map((formGroup: any) => ({
          verkorteGebruikersNaam: formGroup.verkorteGebruikersNaam as string,
          projectGebruikerRolWaarde:
            formGroup.projectGebruikerRolWaarde as string,
        }));

      const amountProjCoord = this.countProjCoord(projectMedewerkersArray);

      if (amountProjCoord <= 3) {
        const projectMedewerkersData: ProjectMedewerkers = {
          projectSleutel: this.projectTypeCode + this.projectNumber,
          projectGebruikers: projectMedewerkersArray,
        };

        this.subscriptions.push(
          this.projectService
            .postMedewerkersToProject(projectMedewerkersData)
            .pipe(
              map(resultResponse => {
                if (
                  resultResponse.resultCodeDto.validatieType !==
                  VALIDATIONTYPE.ERROR
                ) {
                  this.closeModal();
                  this.clearModal();
                }
              })
            )
            .subscribe()
        );
      } else {
        this.toastr.error(
          MESSAGES.FORM_VALIDATION.INVALID_MAX_NUMBER_OF_PROJECTCOORDINATOREN
        );
      }
    }
    if (this.addedMedewerkersFormArray.length === 0) {
      this.closeModal();
      this.clearModal();
    }
  }

  countProjCoord(projectGebruikers: ProjectGebruikerDetails[]): number {
    return projectGebruikers.filter(
      gebruiker => gebruiker.projectGebruikerRolWaarde === ROLES.PROJ_COORD.role
    ).length;
  }

  medewerkerIsCurrentGebruiker(verkorteGebruikersNaam: string): boolean {
    return this.gebruiker?.userName === verkorteGebruikersNaam;
  }

  confirmMedewerkerDeletion(medewerker: Gebruiker) {
    this.medewerkerToDelete = medewerker;
    const dialogRef = this.modalService.open<ModalResult>(
      this.confirmDeleteTemplate
    );
    dialogRef.closed.subscribe((result: ModalResult | undefined) => {
      if (result != undefined) {
        if (result.answer == ModalAnswer.Ok) {
          this.removeMedewerkersFromList();
        } else {
          this.cancelMedewerkerDeletion();
        }
      }
    });
  }

  removeMedewerkersFromList() {
    if (this.medewerkerToDelete && this.assignedGebruikersList.length > 0) {
      const index = this.assignedGebruikersList.findIndex(
        m =>
          m.verkorteGebruikersNaam ===
          this.medewerkerToDelete?.verkorteGebruikersNaam
      );

      if (index !== -1) {
        this.assignedGebruikersList.splice(index, 1);
        this.addedMedewerkersFormArray.removeAt(index);
        this.filteredGebruikers.push(this.medewerkerToDelete);
        this.filteredGebruikers.sort((a, b) =>
          a.gebruikersNaam.localeCompare(b.gebruikersNaam)
        );
      }
    }
  }

  cancelMedewerkerDeletion() {
    this.medewerkerToDelete = null;
  }

  closeModal() {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  /**
   * Dit is een custom destroy functie vergelijkbaar met de ngOnDestroy.
   *
   * Wordt getriggered wanneer de gebruiker esc indrukt, kruisje van modal inclickt of de annuleren knop gebruikt
   */
  clearModal() {
    this.subscriptions.forEach(subscription => {
      subscription?.unsubscribe();
    });
    this.filteredGebruikers = [];
    this.assignedGebruikersList = [];
    this.unassignedGebruikersList = [];
    this.addedMedewerkersFormArray.clear();
    this.zoekTerm = '';
    this.searchFieldClicked = false;
  }

  /**
   * dit is een custom init functie vergelijkbaar met de ngOnInit.
   *
   * Wordt getriggered wanneer de modal opent.
   */
  initModal() {
    this.loadAllGebruikers();
  }

  protected readonly alert = alert;
}
