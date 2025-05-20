import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectregelsAanpassenComponent } from './projectregels-aanpassen.component';
import { ProjectRegels } from 'src/app/core/models/project-regels.interface';
import { ContentModalComponent } from 'src/app/shared/components/modal/content-modal/content-modal.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MOCK_INVALID_FORMDATA,
  MOCK_PROJECT_REGELS,
  MOCK_VALID_FORMDATA,
} from 'src/app/mocks/mock-projectregels.constant';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ModalService } from '@services/modal-service/modal.service';
import { ProjectDetailComponent } from '../project-detail.component';
import { SharedModule } from '@shared/shared.module';
import { DialogRef } from '@angular/cdk/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

const mockProjRegels: ProjectRegels = MOCK_PROJECT_REGELS;
let fakeModalService: jasmine.SpyObj<ModalService>;
let fakeToastr: jasmine.SpyObj<ToastrService>;
let fakeDialogRef: jasmine.SpyObj<DialogRef>;

const setupSpies = () => {
  fakeModalService = jasmine.createSpyObj('ModalService', ['open']);
  fakeToastr = jasmine.createSpyObj('ToastrService', ['error']);
  fakeDialogRef = jasmine.createSpyObj('DialogRef', ['close', 'closed']);
};
describe('ProjectregelsAanpassenComponent', () => {
  let component: ProjectregelsAanpassenComponent;
  let fixture: ComponentFixture<ProjectregelsAanpassenComponent>;

  beforeEach(async () => {
    setupSpies();
    await TestBed.configureTestingModule({
      declarations: [
        ProjectregelsAanpassenComponent,
        ContentModalComponent,
        ProjectDetailComponent,
      ],
      imports: [
        FormsModule,
        ReactiveFormsModule,
        SharedModule,
        RouterModule,
        NoopAnimationsModule,
      ],
      providers: [
        {
          provide: ModalService,
          useValue: fakeModalService,
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: { projectSleutel: 'WET1234' } },
          },
        },
        { provide: ToastrService, useValue: fakeToastr },
        {
          provide: DialogRef,
          useValue: fakeDialogRef,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectregelsAanpassenComponent);
    component = fixture.componentInstance;

    component.projectRegels = mockProjRegels;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set the form values to values as in mockProjRegels when initModal has been called', () => {
    component.initModal();

    const mockForm = component.projectRegelsForm.value;
    expect(mockForm).toEqual({
      kortingspercentage: '1,55',
      peildatum: '2024-01-01',
    });
  });

  it('should handle invalid form caused too many decimals for peildatum', () => {
    component.initModal();
    component.projectRegelsForm.setValue(MOCK_INVALID_FORMDATA);

    expect(component.projectRegelsForm.invalid).toBe(true);

    component.onSubmit();

    expect(fakeToastr.error).toHaveBeenCalledWith(
      'Het formulier is niet correct ingevuld.'
    );
  });

  it('should emit projectRegelsUpdateEvent with valid form data', () => {
    spyOn(component.projectRegelsUpdateEvent, 'emit');

    component.projectRegelsForm.setValue(MOCK_VALID_FORMDATA);

    component.onSubmit();

    expect(component.projectRegelsUpdateEvent.emit).toHaveBeenCalledWith(
      MOCK_PROJECT_REGELS
    );
  });

  it('should convert BE date to FE date when initializing form', () => {
    component.projectRegels = mockProjRegels;
    component.initModal();
    expect(component.projectRegelsForm.value.peildatum).toBe('2024-01-01');
  });
});
