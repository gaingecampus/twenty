import { Field, ObjectType } from '@nestjs/graphql';

import { FieldMetadataDTO } from 'src/engine/metadata-modules/field-metadata/dtos/field-metadata.dto';
import { ObjectMetadataDTO } from 'src/engine/metadata-modules/object-metadata/dtos/object-metadata.dto';

@ObjectType('CreateManyToManyRelation')
export class CreateManyToManyRelationDTO {
  @Field(() => FieldMetadataDTO)
  sourceField: FieldMetadataDTO;

  @Field(() => FieldMetadataDTO)
  targetField: FieldMetadataDTO;

  @Field(() => ObjectMetadataDTO)
  junctionObject: ObjectMetadataDTO;
}
