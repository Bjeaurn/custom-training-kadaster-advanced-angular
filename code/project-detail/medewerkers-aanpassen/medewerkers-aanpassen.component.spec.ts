import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MedewerkersAanpassenComponent } from './medewerkers-aanpassen.component';
import { UserService } from '@services/user/user.service';
import { ModalService } from 'src/app/core/services/modal-service/modal.service';
import { ProjectenService } from 'src/app/core/services/projecten/projecten.service';
import { ToastrService } from 'ngx-toastr';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ROLES } from '@constants/roles.constant';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { mockProjectSleutel } from '../../../../mocks/mock-project-and-pacht-data';
import {
  mockAddedMedewerkers,
  mockGebruikers,
  mockProjectGebruiker,
} from '../../../../mocks/mock-gebruiker-and-projectgebruiker-data';
import { DialogRef } from '@angular/cdk/dialog';
import { Gebruiker } from '@core/models/gebruiker.interface';
import { ModalAnswer, ModalResult } from '@core/models/modal.model';

let fakeUserService: jasmine.SpyObj<UserService>;
let fakeModalService: jasmine.SpyObj<ModalService>;
let fakeProjectenService: jasmine.SpyObj<ProjectenService>;
let fakeToastrService: jasmine.SpyObj<ToastrService>;
let fakeDialogRef: jasmine.SpyObj<DialogRef>;

const mockUnassignedUsers = mockGebruikers;

const setupSpies = () => {
  fakeUserService = jasmine.createSpyObj<UserService>('UserService', [
    'getGebruikerJWT',
  ]);
  fakeModalService = jasmine.createSpyObj<ModalService>('ModalService', [
    'open',
  ]);
  fakeProjectenService = jasmine.createSpyObj<ProjectenService>(
    'ProjectenService',
    [
      'getAssignedMedewerkers',
      'postMedewerkersToProject',
      'getUnassignedGebruikers',
    ]
  );
  fakeToastrService = jasmine.createSpyObj<ToastrService>('ToastrService', [
    'success',
    'error',
  ]);
  fakeDialogRef = jasmine.createSpyObj('DialogRef', ['close', 'closed']);
  const closedSubject = new BehaviorSubject<ModalResult>({
    answer: ModalAnswer.Ok,
  });
  Object.defineProperty(fakeDialogRef, 'closed', {
    value: closedSubject.asObservable(),
  });
  fakeModalService.open.and.returnValue(fakeDialogRef);
};

describe('MedewerkersAanpassenComponent', () => {
  let component: MedewerkersAanpassenComponent;
  let fixture: ComponentFixture<MedewerkersAanpassenComponent>;
  let formBuilder: FormBuilder;

  beforeEach(async () => {
    setupSpies();

    await TestBed.configureTestingModule({
      declarations: [MedewerkersAanpassenComponent],
      imports: [ReactiveFormsModule, FormsModule],
      providers: [
        FormBuilder,
        { provide: UserService, useValue: fakeUserService },
        { provide: ModalService, useValue: fakeModalService },
        { provide: ProjectenService, useValue: fakeProjectenService },
        { provide: ToastrService, useValue: fakeToastrService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: { projectSleutel: mockProjectSleutel } },
          },
        },
        {
          provide: DialogRef,
          useValue: fakeDialogRef,
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(MedewerkersAanpassenComponent);
    component = fixture.componentInstance;
    formBuilder = TestBed.inject(FormBuilder);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize searchFieldClicked as false', () => {
    expect(component.searchFieldClicked).toBe(false);
  });

  it('should handle form successfully when valid', () => {
    fakeProjectenService.postMedewerkersToProject.and.returnValue(of());
    const addedMedewerkers = mockAddedMedewerkers.map(medewerker => {
      return formBuilder.group({
        verkorteGebruikersNaam: [
          medewerker.verkorteGebruikersNaam,
          Validators.required,
        ],
        projectGebruikerRol: [
          medewerker.projectGebruikerRolWaarde,
          Validators.required,
        ],
      });
    });

    addedMedewerkers.forEach(medewerker => {
      component.addedMedewerkersFormArray.push(medewerker);
    });

    component.onSubmit();

    expect(component.medewerkersToevoegenForm.valid).toBe(true);
  });

  it('should not handle form when invalid', () => {
    const tooManyAddedMedewerkersMock = [
      {
        verkorteGebruikersNaam: 'abcde',
        projectGebruikerRolWaarde: ROLES.PROJ_COORD.role,
      },
      {
        verkorteGebruikersNaam: 'fghijk',
        projectGebruikerRolWaarde: ROLES.PROJ_COORD.role,
      },
      {
        verkorteGebruikersNaam: 'lmnopq',
        projectGebruikerRolWaarde: ROLES.PROJ_COORD.role,
      },
      {
        verkorteGebruikersNaam: 'rstuvw',
        projectGebruikerRolWaarde: ROLES.PROJ_COORD.role,
      },
    ];

    const addedMedewerkers = tooManyAddedMedewerkersMock.map(medewerker => {
      return formBuilder.group({
        verkorteGebruikersNaam: [
          medewerker.verkorteGebruikersNaam,
          Validators.required,
        ],
        projectGebruikerRolWaarde: [
          medewerker.projectGebruikerRolWaarde,
          Validators.required,
        ],
      });
    });

    addedMedewerkers.forEach(medewerker => {
      component.addedMedewerkersFormArray.push(medewerker);
    });

    component.onSubmit();

    expect(fakeToastrService.error).toHaveBeenCalled();
  });

  it('should filter medewerkers list when search field changes', () => {
    fakeProjectenService.getUnassignedGebruikers.and.returnValue(
      of(mockUnassignedUsers)
    );
    component.loadAndSubscribeUnassignedGebruikers();

    const zoekTerm = 'Tweede';
    component.onChangeZoekveld(zoekTerm);

    expect(component.filteredGebruikers.length).toBe(1);
    expect(component.filteredGebruikers[0].gebruikersNaam).toBe('Tweede SLIM');
  });

  it('should add medewerker to selected list', () => {
    fakeProjectenService.getUnassignedGebruikers.and.returnValue(
      of(mockUnassignedUsers)
    );

    component.loadAndSubscribeUnassignedGebruikers();
    expect(component.assignedGebruikersList.length).toBe(0);

    component.addMedewerkersToList(mockUnassignedUsers[0]);
    expect(component.assignedGebruikersList.length).toBe(1);
  });

  it('should delete medewerker from list', () => {
    component.assignedGebruikersList = mockUnassignedUsers;
    const medewerkerToBeDeleted = mockUnassignedUsers[0];
    component.medewerkerToDelete = medewerkerToBeDeleted;

    expect(component.assignedGebruikersList.length).toBe(2);

    component.removeMedewerkersFromList();

    expect(component.assignedGebruikersList.length).toBe(1);
    expect(
      component.assignedGebruikersList.find(
        m =>
          m.verkorteGebruikersNaam ===
          medewerkerToBeDeleted.verkorteGebruikersNaam
      )
    ).toBeUndefined();
  });

  it('should count number of project coordinators in added medewerkers', () => {
    expect(component.countProjCoord(mockAddedMedewerkers)).toBe(1);
  });

  it('should initialize modal with already assigned medewerkers', () => {
    fakeProjectenService.getAssignedMedewerkers.and.returnValue(
      of(mockProjectGebruiker)
    );
    component.loadAndSubscribeAssignedMedewerkers();

    expect(component.assignedGebruikersList.length).toBe(2);
  });

  it('should set medewerkerToDelete and open confirmation modal', () => {
    const medewerkerToBeDeleted = mockUnassignedUsers[0];
    component.confirmMedewerkerDeletion(medewerkerToBeDeleted);

    expect(component.medewerkerToDelete).toEqual(medewerkerToBeDeleted);
    expect(fakeModalService.open).toHaveBeenCalled();
  });

  it('should confirm medewerker deletion', () => {
    const mockMedewerker: Gebruiker = mockGebruikers[0];
    const removeSpy = spyOn(component, 'removeMedewerkersFromList');
    component.confirmMedewerkerDeletion(mockMedewerker);
    expect(component.medewerkerToDelete).toEqual(mockMedewerker);
    expect(fakeModalService.open).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
  });

  it('should reset medewerkerToDelete on cancel', () => {
    component.medewerkerToDelete = mockUnassignedUsers[0];

    component.cancelMedewerkerDeletion();

    expect(component.medewerkerToDelete).toBeNull();
  });
});
