import { TestBed } from '@angular/core/testing';

import { MergeDataService } from './merge-data.service';

describe('MergeDataService', () => {
  let service: MergeDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MergeDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
