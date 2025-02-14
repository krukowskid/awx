import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { PageSection, Card } from '@patternfly/react-core';
import { CardBody } from '../../../components/Card';

import { InventoriesAPI } from '../../../api';
import InventoryForm from '../shared/InventoryForm';

function InventoryAdd() {
  const [error, setError] = useState(null);
  const history = useHistory();

  const handleCancel = () => {
    history.push('/inventories');
  };

  const handleSubmit = async values => {
    const { instanceGroups, organization, ...remainingValues } = values;
    try {
      const {
        data: { id: inventoryId },
      } = await InventoriesAPI.create({
        organization: organization.id,
        ...remainingValues,
      });
      if (instanceGroups) {
        const associatePromises = instanceGroups.map(async ig =>
          InventoriesAPI.associateInstanceGroup(inventoryId, ig.id)
        );
        await Promise.all(associatePromises);
      }
      const url = history.location.pathname.startsWith(
        '/inventories/smart_inventory'
      )
        ? `/inventories/smart_inventory/${inventoryId}/details`
        : `/inventories/inventory/${inventoryId}/details`;

      history.push(`${url}`);
    } catch (err) {
      setError(err);
    }
  };

  return (
    <PageSection>
      <Card>
        <CardBody>
          <InventoryForm
            onCancel={handleCancel}
            onSubmit={handleSubmit}
            submitError={error}
          />
        </CardBody>
      </Card>
    </PageSection>
  );
}

export { InventoryAdd as _InventoryAdd };
export default InventoryAdd;
