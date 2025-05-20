import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectgegevensAanpassenComponent } from './projectgegevens-aanpassen.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ProjectenService } from 'src/app/core/services/projecten/projecten.service';
import { of } from 'rxjs';
import { ROLES } from 'src/app/shared/constants/roles.constant';
import { ContentModalComponent } from 'src/app/shared/components/modal/content-modal/content-modal.component';
import { ResultResponse } from 'src/app/core/models/result-response.interface';
import { ProjectDetails } from 'src/app/core/models/project-details.interface';
import { MOCK_MORE_THAN_300_CHARS } from 'src/app/mocks/mock-more-than-300-chars.constant';
import { MOCK_MORE_THAN_1000_CHARS } from 'src/app/mocks/mock-more-than-1000-chars.constant';
import { DialogRef } from '@angular/cdk/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

const mockProjectDetails: ProjectDetails = {
  projectNummer: 1234,
  projectNaam: 'Testproject',
  projectOmschrijving: 'Project omschrijving',
  projectSleutel: 'WET1234',
  projectType: {
    waarde: 'Wettelijke herverkaveling',
    code: 'WET',
  },
};

let fakeProjectenService: jasmine.SpyObj<ProjectenService>;
let fakeToastr: jasmine.SpyObj<ToastrService>;
let fakeDialogRef: jasmine.SpyObj<DialogRef>;

const setupSpies = () => {
  fakeProjectenService = jasmine.createSpyObj('ProjectenService', {
    getProject: of([mockProjectDetails]),
    getProjectUserRole: of([ROLES.PROJ_COORD]),
    putChangedDataToProject: of(undefined),
  });
  fakeToastr = jasmine.createSpyObj('ToastrService', ['success', 'error']);
  fakeDialogRef = jasmine.createSpyObj('DialogRef', ['close', 'closed']);
};

describe('ProjectgegevensAanpassenComponent', () => {
  let component: ProjectgegevensAanpassenComponent;
  let fixture: ComponentFixture<ProjectgegevensAanpassenComponent>;

  beforeEach(async () => {
    setupSpies();
    await TestBed.configureTestingModule({
      declarations: [ProjectgegevensAanpassenComponent, ContentModalComponent],
      imports: [ReactiveFormsModule, FormsModule, NoopAnimationsModule],
      providers: [
        {
          provide: ProjectenService,
          useValue: fakeProjectenService,
        },
        { provide: ToastrService, useValue: fakeToastr },
        {
          provide: DialogRef,
          useValue: fakeDialogRef,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectgegevensAanpassenComponent);
    component = fixture.componentInstance;

    component.projectDetails = mockProjectDetails;

    fixture.detectChanges();

    spyOn(component.projectUpdateEvent, 'emit');
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set the form values to values as in mockProjectDetails when initModal has been called', () => {
    component.initModal();

    const mockForm = component.projectGegevensForm.value;
    expect(mockForm).toEqual({
      projectNaam: mockProjectDetails.projectNaam,
      omschrijving: mockProjectDetails.projectOmschrijving,
    });
  });

  it('should set values for projectType and projectNumber when initModal has been called', () => {
    component.initModal();

    expect(component.projectType).toEqual(
      mockProjectDetails.projectType.waarde
    );
    expect(component.projectNumber).toEqual(
      mockProjectDetails.projectType.code + mockProjectDetails.projectNummer
    );
  });

  it('should set form to invalid when no value is provided by user for projectNaam or projectOmschrijving', () => {
    component.initModal();
    const inValidFormData = { projectNaam: null, omschrijving: null };
    component.projectGegevensForm.setValue(inValidFormData);

    component.onSubmit();

    expect(component.projectGegevensForm.value['projectNaam']).toEqual(null);
    expect(component.projectGegevensForm.value['omschrijving']).toEqual(null);
    expect(component.projectGegevensForm.valid).toBe(false);
    expect(component.projectUpdateEvent.emit).not.toHaveBeenCalledWith(
      mockProjectDetails
    );
  });

  it('should set value for formValue.projectNaam and formValue.omschrijving to the value that user has provided as a new value', () => {
    component.initModal();
    const validFormData = {
      projectNaam: 'Nieuwe naam',
      omschrijving: 'Nieuwe omschrijving',
    };
    component.projectGegevensForm.setValue(validFormData);

    const mockProjectDetailsAltered: ProjectDetails = {
      projectNummer: 1234,
      projectNaam: validFormData.projectNaam,
      projectOmschrijving: validFormData.omschrijving,
      projectSleutel: 'WET1234',
      projectType: {
        waarde: 'Wettelijke herverkaveling',
        code: 'WET',
      },
    };

    const mockResultResponse: ResultResponse<unknown[]> = {
      responseObjectDtos: [[validFormData]],
      resultCodeDto: {
        validatieCode: '200',
        validatieType: 'SUCCESS',
        message: ['Je wijziging is succesvol verwerkt'],
      },
    };

    fakeProjectenService.putChangedDataToProject.and.returnValue(
      of(mockResultResponse)
    );

    component.onSubmit();

    expect(component.projectGegevensForm.value['projectNaam']).toEqual(
      validFormData.projectNaam
    );
    expect(component.projectGegevensForm.value['omschrijving']).toEqual(
      validFormData.omschrijving
    );
    expect(component.projectGegevensForm.valid).toBe(true);
    expect(component.projectUpdateEvent.emit).toHaveBeenCalledWith(
      mockProjectDetailsAltered
    );
  });

  it('should set value for formValue.projectNaam to the value that user has provided but not set omschrijving', () => {
    component.initModal();
    const validFormData = {
      projectNaam: 'Nieuwe naam',
      omschrijving: 'Oude omschrijving',
    };
    component.projectGegevensForm.setValue(validFormData);

    const mockProjectDetailsAltered: ProjectDetails = {
      projectNummer: 1234,
      projectNaam: validFormData.projectNaam,
      projectOmschrijving: 'Oude omschrijving',
      projectSleutel: 'WET1234',
      projectType: {
        waarde: 'Wettelijke herverkaveling',
        code: 'WET',
      },
    };

    const mockResultResponse: ResultResponse<unknown[]> = {
      responseObjectDtos: [[validFormData]],
      resultCodeDto: {
        validatieCode: '200',
        validatieType: 'SUCCESS',
        message: ['Je wijziging is succesvol verwerkt'],
      },
    };

    fakeProjectenService.putChangedDataToProject.and.returnValue(
      of(mockResultResponse)
    );

    component.onSubmit();

    expect(component.projectGegevensForm.value['projectNaam']).toEqual(
      validFormData.projectNaam
    );
    expect(component.projectGegevensForm.value['omschrijving']).toEqual(
      'Oude omschrijving'
    );
    expect(component.projectGegevensForm.valid).toBe(true);
    expect(component.projectUpdateEvent.emit).toHaveBeenCalledWith(
      mockProjectDetailsAltered
    );
  });

  it('should handle invalid form caused by >300 chars for projectNaam', () => {
    component.initModal();
    const inValidFormData = {
      projectNaam: MOCK_MORE_THAN_300_CHARS,
      omschrijving: mockProjectDetails.projectOmschrijving,
    };
    component.projectGegevensForm.setValue(inValidFormData);

    spyOn(component.projectGegevensForm, 'markAllAsTouched');

    expect(component.projectGegevensForm.invalid).toBe(true);

    component.onSubmit();

    expect(component.projectGegevensForm.markAllAsTouched).toHaveBeenCalled();
    expect(fakeToastr.error).toHaveBeenCalledWith(
      'Het formulier is niet correct ingevuld.'
    );
  });

  it('should handle invalid form caused by >1000 chars for omschrijving', () => {
    component.initModal();
    const inValidFormData = {
      projectNaam: mockProjectDetails.projectNaam,
      omschrijving: MOCK_MORE_THAN_1000_CHARS,
    };
    component.projectGegevensForm.setValue(inValidFormData);

    spyOn(component.projectGegevensForm, 'markAllAsTouched');

    expect(component.projectGegevensForm.invalid).toBe(true);

    component.onSubmit();

    expect(component.projectGegevensForm.markAllAsTouched).toHaveBeenCalled();
    expect(fakeToastr.error).toHaveBeenCalledWith(
      'Het formulier is niet correct ingevuld.'
    );
  });

  it('should not display omschrijving textarea if allowEdit is false', () => {
    component.allowEdit = false;
    fixture.detectChanges();
    const textarea = fixture.debugElement.nativeElement.querySelector(
      '#forms-text-area-omschrijving'
    );
    expect(textarea).toBeNull();
  });

  it('should display omschrijving textarea if allowEdit is true', () => {
    component.allowEdit = true;
    fixture.detectChanges();
    const textarea = fixture.debugElement.nativeElement.querySelector(
      '#forms-text-area-omschrijving'
    );
    expect(textarea).toBeTruthy();
  });
});
