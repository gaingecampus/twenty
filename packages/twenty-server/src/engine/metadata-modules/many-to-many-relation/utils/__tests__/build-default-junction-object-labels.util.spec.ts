import { buildDefaultJunctionObjectLabels } from 'src/engine/metadata-modules/many-to-many-relation/utils/build-default-junction-object-labels.util';

describe('buildDefaultJunctionObjectLabels', () => {
  it('should build singular and plural labels from source and target labels', () => {
    expect(
      buildDefaultJunctionObjectLabels({
        sourceLabelSingular: 'Company',
        targetLabelSingular: 'Person',
      }),
    ).toEqual({
      labelSingular: 'Company Person Link',
      labelPlural: 'Company Person Links',
    });
  });
});
