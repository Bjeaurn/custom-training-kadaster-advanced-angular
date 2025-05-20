import {
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Project } from 'src/app/core/models/project.interface';
import { ProjectenService } from 'src/app/core/services/projecten/projecten.service';
import { Observable, Subscription, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { ModalService } from 'src/app/core/services/modal-service/modal.service';
import { RoleType } from '@constants/roles.constant';
import { RolesService } from '@services/roles/roles.service';
import { BEHAVIOR_ROLES } from '@constants/behavior-roles.constant';
import { PROJECT_TYPES } from '@constants/project-types.constant';
import { BASE_URL } from 'src/app/app-constants/base-url.constant';
import { ProjectRegels } from 'src/app/core/models/project-regels.interface';
import { VALIDATIONTYPE } from '@shared/enums/validation-type.enum';
import { ProjectDetails } from '@core/models/project-details.interface';
import { DialogRef } from '@angular/cdk/dialog';

@Component({
  selector: 'app-project-detail',
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.scss'],
  standalone: false,
})
export class ProjectDetailComponent implements OnInit, OnDestroy {
  baseUrl = BASE_URL;
  userRole: string | undefined = '';
  projectDetails!: Project | null;
  projectRegels$!: Observable<ProjectRegels | null>;
  projectSleutel: string;
  projectUserRolesSubscription!: Subscription;
  showMedewerkersLink = false;
  allowProjectGegevensEdit = false;
  allowProjectRegelsEdit = false;
  protected readonly PROJECT_TYPES = PROJECT_TYPES;

  readonly medewerkerModalName = 'medewerkers-aanpassen-modal';
  readonly projectGegevensModalName = 'projectgegevens-aanpassen-modal';
  readonly projectRegelsModalName = 'projectregels-aanpassen-modal';

  @ViewChild('medewerkersModalTemplate', { static: false })
  medewerkersModalTemplate!: TemplateRef<Element>;
  @ViewChild('projectgegevensModalTemplate', { static: false })
  projectgegevensModalTemplate!: TemplateRef<Element>;
  @ViewChild('projectregelsModalTemplate', { static: false })
  projectregelsModalTemplate!: TemplateRef<Element>;
  private projectGegevensModalRef!: DialogRef<unknown, Element>;
  private projectRegelsModalRef!: DialogRef<unknown, Element>;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly projectenService: ProjectenService,
    private readonly modalService: ModalService,
    private readonly rolesService: RolesService
  ) {
    this.projectSleutel = this.route.snapshot.params['projectSleutel'];
  }

  ngOnInit(): void {
    this.setProjectDetails(this.retrieveProjectDetails());
    this.getProjectUserRoles(this.projectSleutel);
    this.projectRegels$ = this.retrieveProjectRegels();
  }

  setProjectDetails(projectDetails: Observable<Project | null>) {
    projectDetails.subscribe(projDetails => {
      this.projectDetails = projDetails;
    });
  }

  getProjectUserRoles(projectSleutel: string): void {
    this.projectUserRolesSubscription = this.projectenService
      .getProjectUserRole(projectSleutel)
      .subscribe(projectRoles => this.handleUserRole(projectRoles));
  }

  handleUserRole(projectRoles: Partial<RoleType>[]): void {
    this.showMedewerkersLink = this.rolesService.hasRequiredRolePair(
      projectRoles,
      BEHAVIOR_ROLES.SHOW_MEDEWERKERS_LINK
    );
    this.allowProjectGegevensEdit = this.rolesService.hasRequiredRolePair(
      projectRoles,
      BEHAVIOR_ROLES.EDIT_PROJECT_GEGEVENS
    );
    this.allowProjectRegelsEdit = this.rolesService.hasRequiredRolePair(
      projectRoles,
      BEHAVIOR_ROLES.EDIT_PROJECT_REGELS
    );
    this.userRole = projectRoles[0].waarde;
  }

  openModal(modalName: string) {
    switch (modalName) {
      case this.medewerkerModalName:
        this.modalService.open(this.medewerkersModalTemplate);
        break;
      case this.projectGegevensModalName:
        this.projectGegevensModalRef = this.modalService.open(
          this.projectgegevensModalTemplate
        );
        break;
      case this.projectRegelsModalName:
        this.projectRegelsModalRef = this.modalService.open(
          this.projectregelsModalTemplate
        );
        break;
    }
  }

  retrieveProjectDetails(): Observable<Project | null> {
    return this.projectenService
      .getProject(this.projectSleutel)
      .pipe(map(projects => this.mapResponse(projects)));
  }

  retrieveProjectRegels(): Observable<ProjectRegels | null> {
    return this.projectenService
      .getProjectRegels(this.projectSleutel)
      .pipe(map(regels => this.mapResponse(regels)));
  }

  submitProjectDetails($event: ProjectDetails): void {
    this.projectenService
      .putChangedDataToProject($event.projectSleutel as string, $event)
      .pipe(
        map(resultResponse => {
          if (
            resultResponse.resultCodeDto.validatieType !== VALIDATIONTYPE.ERROR
          ) {
            this.projectDetails!.projectNaam = $event.projectNaam;
            if ($event.projectOmschrijving != null) {
              this.projectDetails!.projectOmschrijving =
                $event.projectOmschrijving;
            }
            this.closeProjectGegevensModal();
          }
        })
      )
      .subscribe();
  }

  submitProjectRegels(projectSleutel: string, $event: ProjectRegels): void {
    this.projectenService
      .addOrUpdateProjectRegels(projectSleutel, $event)
      .pipe(
        tap(resultResponse => {
          if (
            resultResponse.resultCodeDto.validatieType !== VALIDATIONTYPE.ERROR
          ) {
            this.projectRegels$ = this.retrieveProjectRegels();
            this.closeProjectRegelsModal();
          }
        })
      )
      .subscribe();
  }

  mapResponse(responseElements: any) {
    return responseElements && responseElements.length > 0
      ? responseElements[0]
      : null;
  }

  closeProjectGegevensModal() {
    if (this.projectGegevensModalRef) {
      this.projectGegevensModalRef.close();
    }
  }

  closeProjectRegelsModal() {
    if (this.projectRegelsModalRef) {
      this.projectRegelsModalRef.close();
    }
  }

  ngOnDestroy(): void {
    this.projectUserRolesSubscription?.unsubscribe();
  }
}
