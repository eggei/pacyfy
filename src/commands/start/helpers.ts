import { Service, ServiceDeclarationFields } from "../../config";

export function validateServiceDeclaration(services: Service[]) {
  const requiredFields: ServiceDeclarationFields[] = [
    ServiceDeclarationFields.name,
    ServiceDeclarationFields.run,
    ServiceDeclarationFields.healthCheckURL,
  ];

  const missingConfig: string[] = [];

  services.forEach((service, i) => {
    requiredFields.forEach((field) => {
      if (!service[field]) {
        if (field === ServiceDeclarationFields.name) {
          missingConfig.push(`Service at index ${i} is missing name field`);
          return;
        }
        missingConfig.push(
          `${service.name} is missing "${field}" field in service declaration`
        );
      }
    });
  });
  return missingConfig;
}
