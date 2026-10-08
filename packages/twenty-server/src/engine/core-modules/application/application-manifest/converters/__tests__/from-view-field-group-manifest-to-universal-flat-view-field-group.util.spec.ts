import { fromViewFieldGroupManifestToUniversalFlatViewFieldGroup } from 'src/engine/core-modules/application/application-manifest/converters/from-view-field-group-manifest-to-universal-flat-view-field-group.util';

describe('fromViewFieldGroupManifestToUniversalFlatViewFieldGroup', () => {
  it.each([true, false, undefined])(
    'preserves default collapse preferences (%s)',
    (isCollapsed) => {
      const result = fromViewFieldGroupManifestToUniversalFlatViewFieldGroup({
        viewFieldGroupManifest: {
          universalIdentifier: 'group-id',
          position: 0,
          isCollapsed,
        },
        viewUniversalIdentifier: 'view-id',
        applicationUniversalIdentifier: 'application-id',
        now: '2026-10-08T00:00:00.000Z',
      });

      expect(result.isCollapsed).toBe(isCollapsed ?? false);
    },
  );
});
