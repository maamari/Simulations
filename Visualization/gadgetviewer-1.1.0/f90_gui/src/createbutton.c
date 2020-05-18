#include "../../config.h"
#define CREATEIMAGEBUTTON_F90 FC_FUNC (createimagebutton, CREATEIMAGEBUTTON)
#include "../../config.h"
#define CREATEBUTTON_F90 FC_FUNC (createbutton, CREATEBUTTON)
#include "gtk/gtk.h"
#include "pack_box.h"
#include "set_event_handler.h"

void button_event( GtkWidget *widget, gpointer data)
{
  int *iptr;
  iptr = (int *) data;
  *iptr = 1;
  if(event_handler != NULL) (*event_handler)();
  return;
}

void CREATEBUTTON_F90(GtkWidget **button,int *clicked, GtkWidget **box, char *lbl)
{
  *button = gtk_button_new_with_mnemonic (lbl);
  pack_box(*box, *button);
  gtk_signal_connect (GTK_OBJECT (*button), "clicked",
		      GTK_SIGNAL_FUNC (button_event), (gpointer) clicked);
}

void CREATEIMAGEBUTTON_F90(GtkWidget **button,int *clicked, GtkWidget **box,
			char *fname)
{
  GtkWidget *image = gtk_image_new_from_file(fname);
  *button = gtk_button_new();
  gtk_container_add(GTK_CONTAINER(*button), image);

  pack_box(*box, *button);
  gtk_signal_connect (GTK_OBJECT (*button), "clicked",
		      GTK_SIGNAL_FUNC (button_event), (gpointer) clicked);
}
