import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProjectDetailComponent } from './project-detail.component';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProjectenService } from 'src/app/core/services/projecten/projecten.service';
import { Project } from 'src/app/core/models/project.interface';
import { of } from 'rxjs';
import { MedewerkersAanpassenComponent } from './medewerkers-aanpassen/medewerkers-aanpassen.component';
import { ProjectgegevensAanpassenComponent } from './projectgegevens-aanpassen/projectgegevens-aanpassen.component';
import { SharedModule } from '@shared/shared.module';
import { ROLES, RoleType } from '@constants/roles.constant';
import { RolesService } from '@services/roles/roles.service';
import { BEHAVIOR_ROLES } from '@constants/behavior-roles.constant';
import { ModalService } from 'src/app/core/services/modal-service/modal.service';
import { ToastrService } from 'ngx-toastr';
import { ProjectRegels } from 'src/app/core/models/project-regels.interface';
import { ProjectregelsAanpassenComponent } from './projectregels-aanpassen/projectregels-aanpassen.component';
import { MOCK_PROJECT_REGELS } from 'src/app/mocks/mock-projectregels.constant';
import { ProjectBackButtonComponent } from '@shared/components/project-back-button/project-back-button.component';
import { ProjectDetails } from '@core/models/project-details.interface';
import { MOCK_PROJECT_DETAILS } from '../../../mocks/mock-project-details.constant';
import { DialogRef } from '@angular/cdk/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

const mockProject: Project = {
  projectNummer: 1234,
  projectNaam: 'Testproject',
  projectOmschrijving: 'Project omschrijving',
  projectType: {
    waarde: 'Wettelijke herverkaveling',
    code: 'WET',
  },
};

const mockProjRegels: ProjectRegels = MOCK_PROJECT_REGELS;

let fakeProjectenService: jasmine.SpyObj<ProjectenService>;
let fakeModalService: jasmine.SpyObj<ModalService>;
let fakeRolesService: jasmine.SpyObj<RolesService>;
let fakeToastr: jasmine.SpyObj<ToastrService>;
let fakeDialogRef: jasmine.SpyObj<DialogRef>;

const setupSpies = () => {
  fakeProjectenService = jasmine.createSpyObj('ProjectenService', {
    getProject: of([mockProject]),
    getProjectUserRole: of([ROLES.PROJ_COORD]),
    getProjectRegels: of([mockProjRegels]),
    putChangedDataToProject: of({
      resultCodeDto: { validatieType: 'SUCCESS' },
    }),
    addOrUpdateProjectRegels: of({
      resultCodeDto: { validatieType: 'SUCCESS' },
    }),
  });
  fakeRolesService = jasmine.createSpyObj('RolesService', {
    hasRequiredRolePair: undefined,
  });
  fakeModalService = jasmine.createSpyObj('ModalService', ['open']);
  fakeToastr = jasmine.createSpyObj('ToastrService', ['error']);
  fakeDialogRef = jasmine.createSpyObj('DialogRef', ['close', 'closed']);
};

describe('ProjectDetailComponent', () => {
  let component: ProjectDetailComponent;
  let fixture: ComponentFixture<ProjectDetailComponent>;

  beforeEach(async () => {
    setupSpies();
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        SharedModule,
        RouterModule,
        NoopAnimationsModule,
        ProjectBackButtonComponent,
      ],
      declarations: [
        ProjectDetailComponent,
        MedewerkersAanpassenComponent,
        ProjectgegevensAanpassenComponent,
        ProjectregelsAanpassenComponent,
      ],
      providers: [
        {
          provide: ProjectenService,
          useValue: fakeProjectenService,
        },
        {
          provide: ModalService,
          useValue: fakeModalService,
        },
        {
          provide: RolesService,
          useValue: fakeRolesService,
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: { projectSleutel: 'WET1234' } },
          },
        },
        {
          provide: ToastrService,
          useValue: fakeToastr,
        },
        {
          provide: DialogRef,
          useValue: fakeDialogRef,
        },
      ],
    });

    fixture = TestBed.createComponent(ProjectDetailComponent);
    component = fixture.componentInstance;

    component.ngOnInit();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize projectNumber and projectTypeCode from projectSleutel', () => {
    expect(component.projectSleutel).toBe('WET1234');
  });

  it('should set project user role based on projectNumber and projectTypeCode', () => {
    fakeRolesService.hasRequiredRolePair.and.returnValue(true);

    component.getProjectUserRoles('WET1234');

    expect(fakeProjectenService.getProjectUserRole).toHaveBeenCalledWith(
      'WET1234'
    );

    expect(fakeRolesService.hasRequiredRolePair).toHaveBeenCalled();
    expect(component.userRole).toBe(ROLES.PROJ_COORD.role);
    expect(component.showMedewerkersLink).toBe(true);
    expect(component.allowProjectGegevensEdit).toBeTrue();
  });

  it('should set shouldShowData to false if the role is not correct', () => {
    fakeRolesService.hasRequiredRolePair.and.returnValue(false);
    fakeProjectenService.getProjectUserRole.and.returnValue(
      of([ROLES.PROJ_MDW])
    );

    component.getProjectUserRoles('WET5678');

    expect(fakeProjectenService.getProjectUserRole).toHaveBeenCalledWith(
      'WET5678'
    );

    expect(fakeRolesService.hasRequiredRolePair).toHaveBeenCalled();
    expect(component.userRole).toBe(ROLES.PROJ_MDW.role);
    expect(component.showMedewerkersLink).toBe(false);
    expect(component.allowProjectGegevensEdit).toBeFalse();
  });

  it('should set showMedewerkersLink and allowProjectGegevensEdit to true and userRole based on roles', () => {
    fakeRolesService.hasRequiredRolePair.and.returnValue(true);

    const projectRoles = [ROLES.PROJ_COORD as RoleType];
    component.handleUserRole(projectRoles);

    expect(fakeRolesService.hasRequiredRolePair).toHaveBeenCalledWith(
      projectRoles,
      BEHAVIOR_ROLES.SHOW_MEDEWERKERS_LINK
    );
    expect(component.showMedewerkersLink).toBe(true);
    expect(component.allowProjectGegevensEdit).toBeTrue();
    expect(component.userRole).toBe(ROLES.PROJ_COORD.role);
  });

  it('should set showMedewerkersLink and allowProjectGegevensEdit to false when roles are not correct', () => {
    fakeRolesService.hasRequiredRolePair.and.returnValue(false);

    component.handleUserRole([ROLES.PROJ_MDW]);

    expect(fakeRolesService.hasRequiredRolePair).toHaveBeenCalledWith(
      [ROLES.PROJ_MDW],
      BEHAVIOR_ROLES.SHOW_MEDEWERKERS_LINK
    );
    expect(component.showMedewerkersLink).toBe(false);
    expect(component.allowProjectGegevensEdit).toBeFalse();
    expect(component.userRole).toBe(ROLES.PROJ_MDW.role);
  });

  it('should retrieve project details using projectTypeCode and projectNumber', () => {
    expect(component.projectDetails).toEqual(mockProject);
    expect(fakeProjectenService.getProject).toHaveBeenCalledWith('WET1234');
  });

  it('should retrieve projectRegels$ using projectSleutel', () => {
    component.projectRegels$.subscribe(rules => {
      expect(rules).toEqual(mockProjRegels);
    });
    expect(fakeProjectenService.getProjectRegels).toHaveBeenCalledWith(
      'WET1234'
    );
  });

  it('should call modalservice open', () => {
    component.openModal('projectgegevens-aanpassen-modal');
    expect(fakeModalService.open).toHaveBeenCalled();

    component.openModal('medewerkers-aanpassen-modal');
    expect(fakeModalService.open).toHaveBeenCalled();

    component.openModal('projectregels-aanpassen-modal');
    expect(fakeModalService.open).toHaveBeenCalled();
  });

  it('should call putChangedDataToProject and close modal on success', () => {
    const projectDetails: ProjectDetails = MOCK_PROJECT_DETAILS;

    component.submitProjectDetails(projectDetails);
    expect(fakeProjectenService.putChangedDataToProject).toHaveBeenCalledWith(
      'WET1234',
      projectDetails
    );
  });

  it('should call addOrUpdateProjectRegels and close modal on success', () => {
    const projectRegels: ProjectRegels = MOCK_PROJECT_REGELS;
    fakeModalService.open.and.returnValue(fakeDialogRef);
    component.submitProjectRegels('WET1234', projectRegels);
    expect(fakeProjectenService.addOrUpdateProjectRegels).toHaveBeenCalledWith(
      'WET1234',
      projectRegels
    );
  });

  afterEach(() => {
    component.projectUserRolesSubscription?.unsubscribe();
  });
});
